import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Eye, ShoppingCart, Clock, CheckCircle, XCircle, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type OrderItem = { productId: string; productName: string; quantity: number; unitPrice: number; };

export default function PurchaseOrders() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [currentItem, setCurrentItem] = useState({ productId: "", quantity: 1, unitPrice: 0 });
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: suppliers } = trpc.suppliers.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  const { data: purchaseOrders, refetch } = trpc.purchaseOrders.list.useQuery(statusFilter !== "all" ? { status: statusFilter as any } : undefined);

  const createPO = trpc.purchaseOrders.create.useMutation({
    onSuccess: () => { toast.success("สร้างใบสั่งซื้อสำเร็จ"); setIsCreateDialogOpen(false); resetForm(); refetch(); },
    onError: (error) => { toast.error(error.message); },
  });

  const resetForm = () => { setSelectedSupplier(""); setOrderItems([]); setCurrentItem({ productId: "", quantity: 1, unitPrice: 0 }); setExpectedDelivery(""); setNotes(""); };

  const addItem = () => {
    if (!currentItem.productId || currentItem.quantity <= 0) { toast.error("กรุณาเลือกสินค้าและระบุจำนวน"); return; }
    const product = products?.find(p => p.id.toString() === currentItem.productId);
    if (!product) return;
    setOrderItems(prev => [...prev, { productId: currentItem.productId, productName: product.name, quantity: currentItem.quantity, unitPrice: currentItem.unitPrice }]);
    setCurrentItem({ productId: "", quantity: 1, unitPrice: 0 });
  };

  const generatePONumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PO${year}${month}-${random}`;
  };

  const handleCreatePO = () => {
    if (!selectedSupplier || orderItems.length === 0) { toast.error("กรุณาเลือก Supplier และเพิ่มรายการสินค้า"); return; }
    createPO.mutate({
      poNumber: generatePONumber(),
      supplierId: parseInt(selectedSupplier),
      expectedDeliveryDate: expectedDelivery ? new Date(expectedDelivery) : undefined,
      notes: notes || undefined,
      items: orderItems.map(item => ({ productId: parseInt(item.productId), orderedQty: item.quantity, unitPrice: item.unitPrice || undefined })),
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "แบบร่าง", variant: "secondary" }, pending: { label: "รอดำเนินการ", variant: "outline" },
      approved: { label: "อนุมัติแล้ว", variant: "default" }, ordered: { label: "สั่งซื้อแล้ว", variant: "default" },
      partial_received: { label: "รับบางส่วน", variant: "outline" }, received: { label: "รับครบแล้ว", variant: "default" },
      cancelled: { label: "ยกเลิก", variant: "destructive" },
    };
    const config = statusMap[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const pendingCount = purchaseOrders?.filter(po => po.status === 'pending' || po.status === 'partially_received').length || 0;
  const receivedCount = purchaseOrders?.filter(po => po.status === 'completed').length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">ใบสั่งซื้อ</h1>
            <p className="text-muted-foreground mt-1">ระบบจัดการใบสั่งซื้อและติดตามสถานะ</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-2" />สร้างใบสั่งซื้อ</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>สร้างใบสั่งซื้อใหม่</DialogTitle>
                <DialogDescription>เลือก Supplier และเพิ่มรายการสินค้าที่ต้องการสั่งซื้อ</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Supplier *</Label>
                    <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                      <SelectTrigger><SelectValue placeholder="เลือก Supplier" /></SelectTrigger>
                      <SelectContent>{suppliers?.map((s) => (<SelectItem key={s.id} value={s.id.toString()}>{s.code} - {s.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>วันที่คาดว่าจะได้รับ</Label>
                    <Input type="date" value={expectedDelivery} onChange={(e) => setExpectedDelivery(e.target.value)} />
                  </div>
                </div>
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium">เพิ่มรายการสินค้า</h4>
                  <div className="grid grid-cols-4 gap-2">
                    <Select value={currentItem.productId} onValueChange={(v) => setCurrentItem(p => ({ ...p, productId: v }))}>
                      <SelectTrigger className="col-span-2"><SelectValue placeholder="เลือกสินค้า" /></SelectTrigger>
                      <SelectContent>{products?.map((p) => (<SelectItem key={p.id} value={p.id.toString()}>{p.productCode} - {p.name}</SelectItem>))}</SelectContent>
                    </Select>
                    <Input type="number" placeholder="จำนวน" value={currentItem.quantity} onChange={(e) => setCurrentItem(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))} />
                    <Input type="number" placeholder="ราคา/หน่วย" value={currentItem.unitPrice} onChange={(e) => setCurrentItem(p => ({ ...p, unitPrice: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <Button variant="outline" onClick={addItem} className="w-full"><Plus className="w-4 h-4 mr-2" />เพิ่มรายการ</Button>
                </div>
                {orderItems.length > 0 && (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader><TableRow><TableHead>สินค้า</TableHead><TableHead className="text-center">จำนวน</TableHead><TableHead className="text-right">ราคา/หน่วย</TableHead><TableHead className="text-right">รวม</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
                      <TableBody>
                        {orderItems.map((item, i) => (<TableRow key={i}><TableCell>{item.productName}</TableCell><TableCell className="text-center">{item.quantity}</TableCell><TableCell className="text-right">฿{item.unitPrice.toLocaleString()}</TableCell><TableCell className="text-right">฿{(item.quantity * item.unitPrice).toLocaleString()}</TableCell><TableCell><Button variant="ghost" size="sm" onClick={() => setOrderItems(p => p.filter((_, idx) => idx !== i))}><XCircle className="w-4 h-4 text-red-500" /></Button></TableCell></TableRow>))}
                        <TableRow><TableCell colSpan={3} className="text-right font-medium">รวมทั้งหมด</TableCell><TableCell className="text-right font-bold">฿{totalAmount.toLocaleString()}</TableCell><TableCell></TableCell></TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
                <div className="space-y-2"><Label>หมายเหตุ</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="หมายเหตุเพิ่มเติม" /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>ยกเลิก</Button><Button onClick={handleCreatePO} disabled={createPO.isPending}>{createPO.isPending ? "กำลังบันทึก..." : "สร้างใบสั่งซื้อ"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">ใบสั่งซื้อทั้งหมด</CardTitle><ShoppingCart className="h-4 w-4 text-indigo-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{purchaseOrders?.length || 0}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">รอดำเนินการ</CardTitle><Clock className="h-4 w-4 text-orange-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{pendingCount}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">รับครบแล้ว</CardTitle><CheckCircle className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{receivedCount}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">มูลค่ารวม</CardTitle><Truck className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold">฿{purchaseOrders?.reduce((sum, po) => sum + parseFloat(po.totalAmount || "0"), 0).toLocaleString() || 0}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="กรองตามสถานะ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="draft">แบบร่าง</SelectItem>
                <SelectItem value="pending">รอดำเนินการ</SelectItem>
                <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                <SelectItem value="ordered">สั่งซื้อแล้ว</SelectItem>
                <SelectItem value="partial_received">รับบางส่วน</SelectItem>
                <SelectItem value="received">รับครบแล้ว</SelectItem>
                <SelectItem value="cancelled">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader><TableRow className="bg-slate-50"><TableHead>เลขที่ PO</TableHead><TableHead>Supplier</TableHead><TableHead>วันที่สร้าง</TableHead><TableHead>วันที่คาดว่าจะได้รับ</TableHead><TableHead className="text-right">มูลค่ารวม</TableHead><TableHead className="text-center">สถานะ</TableHead><TableHead className="w-[100px]">จัดการ</TableHead></TableRow></TableHeader>
                <TableBody>
                  {purchaseOrders && purchaseOrders.length > 0 ? purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono font-medium">{po.poNumber}</TableCell>
                      <TableCell>{suppliers?.find(s => s.id === po.supplierId)?.name || "-"}</TableCell>
                      <TableCell>{new Date(po.createdAt).toLocaleDateString('th-TH')}</TableCell>
                      <TableCell>{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString('th-TH') : "-"}</TableCell>
                      <TableCell className="text-right">฿{parseFloat(po.totalAmount || "0").toLocaleString()}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(po.status)}</TableCell>
                      <TableCell><Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button></TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={7} className="h-32 text-center"><div className="flex flex-col items-center gap-2 text-muted-foreground"><ShoppingCart className="w-12 h-12" /><p>ยังไม่มีใบสั่งซื้อ</p><Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />สร้างใบสั่งซื้อแรก</Button></div></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
