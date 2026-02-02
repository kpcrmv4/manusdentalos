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
import { Plus, Package, Check, AlertCircle, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ReceiptItem = {
  productId: string;
  productName: string;
  lotNumber: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
  refCode: string;
};

export default function GoodsReceipt() {
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    productId: "", lotNumber: "", expiryDate: "", quantity: 1, unitPrice: 0, refCode: ""
  });
  const [showSummary, setShowSummary] = useState(false);

  const { data: suppliers } = trpc.suppliers.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: products } = trpc.products.list.useQuery(
    selectedCategory ? { categoryId: parseInt(selectedCategory) } : undefined
  );

  const createLot = trpc.inventory.createLot.useMutation({
    onSuccess: () => { toast.success("รับของเข้าคลังสำเร็จ"); },
    onError: (error) => { toast.error(error.message); },
  });

  const filteredProducts = selectedSupplier && products 
    ? products 
    : products;

  const addItem = () => {
    if (!currentItem.productId || !currentItem.lotNumber || currentItem.quantity <= 0) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    const product = products?.find(p => p.id.toString() === currentItem.productId);
    if (!product) return;

    setReceiptItems(prev => [...prev, {
      productId: currentItem.productId,
      productName: product.name,
      lotNumber: currentItem.lotNumber,
      expiryDate: currentItem.expiryDate,
      quantity: currentItem.quantity,
      unitPrice: currentItem.unitPrice,
      refCode: currentItem.refCode,
    }]);
    setCurrentItem({ productId: "", lotNumber: "", expiryDate: "", quantity: 1, unitPrice: 0, refCode: "" });
  };

  const removeItem = (index: number) => {
    setReceiptItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmReceipt = async () => {
    if (receiptItems.length === 0) {
      toast.error("กรุณาเพิ่มรายการสินค้า");
      return;
    }

    try {
      for (const item of receiptItems) {
        await createLot.mutateAsync({
          productId: parseInt(item.productId),
          lotNumber: item.lotNumber,
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
          physicalQty: item.quantity,
          costPrice: item.unitPrice || undefined,
          supplierId: selectedSupplier ? parseInt(selectedSupplier) : undefined,
          invoiceNo: invoiceNo || undefined,
          refCode: item.refCode || undefined,
        });
      }
      toast.success("รับของเข้าคลังสำเร็จทั้งหมด");
      setIsReceiveDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการรับของ");
    }
  };

  const resetForm = () => {
    setSelectedSupplier("");
    setSelectedCategory("");
    setInvoiceNo("");
    setReceiptItems([]);
    setCurrentItem({ productId: "", lotNumber: "", expiryDate: "", quantity: 1, unitPrice: 0, refCode: "" });
    setShowSummary(false);
  };

  const totalAmount = receiptItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalItems = receiptItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">รับของเข้าคลัง</h1>
            <p className="text-muted-foreground mt-1">บันทึกการรับสินค้าเข้าคลังจาก Supplier</p>
          </div>
          <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                รับของเข้าคลัง
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{showSummary ? "สรุปการรับของเข้าคลัง" : "รับของเข้าคลัง"}</DialogTitle>
                <DialogDescription>
                  {showSummary ? "ตรวจสอบรายการก่อนยืนยัน" : "เลือก Supplier และเพิ่มรายการสินค้าที่รับเข้าคลัง"}
                </DialogDescription>
              </DialogHeader>

              {!showSummary ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Supplier *</Label>
                      <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                        <SelectTrigger><SelectValue placeholder="เลือก Supplier" /></SelectTrigger>
                        <SelectContent>
                          {suppliers?.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.code} - {s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>หมวดหมู่</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                          {categories?.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>เลขที่ Invoice</Label>
                      <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="INV-XXXXX" />
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-medium">เพิ่มรายการสินค้า</h4>
                    <div className="grid grid-cols-6 gap-2">
                      <Select value={currentItem.productId} onValueChange={(v) => setCurrentItem(p => ({ ...p, productId: v }))}>
                        <SelectTrigger className="col-span-2"><SelectValue placeholder="เลือกสินค้า" /></SelectTrigger>
                        <SelectContent>
                          {filteredProducts?.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>{p.productCode} - {p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input placeholder="Lot No." value={currentItem.lotNumber} onChange={(e) => setCurrentItem(p => ({ ...p, lotNumber: e.target.value }))} />
                      <Input type="date" placeholder="วันหมดอายุ" value={currentItem.expiryDate} onChange={(e) => setCurrentItem(p => ({ ...p, expiryDate: e.target.value }))} />
                      <Input type="number" placeholder="จำนวน" value={currentItem.quantity} onChange={(e) => setCurrentItem(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))} />
                      <Input placeholder="REF" value={currentItem.refCode} onChange={(e) => setCurrentItem(p => ({ ...p, refCode: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      <div className="col-span-5"></div>
                      <Input type="number" placeholder="ราคา/หน่วย" value={currentItem.unitPrice} onChange={(e) => setCurrentItem(p => ({ ...p, unitPrice: parseFloat(e.target.value) || 0 }))} />
                    </div>
                    <Button variant="outline" onClick={addItem} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />เพิ่มรายการ
                    </Button>
                  </div>

                  {receiptItems.length > 0 && (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>สินค้า</TableHead>
                            <TableHead>Lot No.</TableHead>
                            <TableHead>วันหมดอายุ</TableHead>
                            <TableHead>REF</TableHead>
                            <TableHead className="text-center">จำนวน</TableHead>
                            <TableHead className="text-right">ราคา/หน่วย</TableHead>
                            <TableHead className="text-right">รวม</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {receiptItems.map((item, i) => (
                            <TableRow key={i}>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell className="font-mono">{item.lotNumber}</TableCell>
                              <TableCell>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('th-TH') : "-"}</TableCell>
                              <TableCell>{item.refCode || "-"}</TableCell>
                              <TableCell className="text-center">{item.quantity}</TableCell>
                              <TableCell className="text-right">฿{item.unitPrice.toLocaleString()}</TableCell>
                              <TableCell className="text-right">฿{(item.quantity * item.unitPrice).toLocaleString()}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => removeItem(i)}>
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">ข้อมูลการรับของ</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Supplier:</span>
                        <span className="font-medium">{suppliers?.find(s => s.id.toString() === selectedSupplier)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">เลขที่ Invoice:</span>
                        <span className="font-medium">{invoiceNo || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">จำนวนรายการ:</span>
                        <span className="font-medium">{receiptItems.length} รายการ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">จำนวนสินค้ารวม:</span>
                        <span className="font-medium">{totalItems} ชิ้น</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>มูลค่ารวม:</span>
                        <span className="text-indigo-600">฿{totalAmount.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead>สินค้า</TableHead>
                          <TableHead>Lot No.</TableHead>
                          <TableHead>วันหมดอายุ</TableHead>
                          <TableHead>REF</TableHead>
                          <TableHead className="text-center">จำนวน</TableHead>
                          <TableHead className="text-right">ราคา/หน่วย</TableHead>
                          <TableHead className="text-right">รวม</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receiptItems.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell className="font-mono">{item.lotNumber}</TableCell>
                            <TableCell>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('th-TH') : "-"}</TableCell>
                            <TableCell>{item.refCode || "-"}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">฿{item.unitPrice.toLocaleString()}</TableCell>
                            <TableCell className="text-right">฿{(item.quantity * item.unitPrice).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <DialogFooter>
                {!showSummary ? (
                  <>
                    <Button variant="outline" onClick={() => setIsReceiveDialogOpen(false)}>ยกเลิก</Button>
                    <Button onClick={() => setShowSummary(true)} disabled={receiptItems.length === 0}>
                      ดูสรุปก่อนยืนยัน
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setShowSummary(false)}>กลับไปแก้ไข</Button>
                    <Button onClick={handleConfirmReceipt} disabled={createLot.isPending} className="bg-green-600 hover:bg-green-700">
                      <Check className="w-4 h-4 mr-2" />
                      {createLot.isPending ? "กำลังบันทึก..." : "ยืนยันการรับของ"}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รับของวันนี้</CardTitle>
              <Package className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">รายการ</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">รอรับของ</CardTitle>
              <Truck className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">0</div>
              <p className="text-xs text-muted-foreground">ใบสั่งซื้อ</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">มูลค่ารับเข้าเดือนนี้</CardTitle>
              <Check className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">฿0</div>
              <p className="text-xs text-muted-foreground">บาท</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ประวัติการรับของ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>วันที่รับ</TableHead>
                    <TableHead>เลขที่ Invoice</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-center">จำนวนรายการ</TableHead>
                    <TableHead className="text-right">มูลค่ารวม</TableHead>
                    <TableHead className="text-center">สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Package className="w-12 h-12" />
                        <p>ยังไม่มีประวัติการรับของ</p>
                        <Button variant="outline" size="sm" onClick={() => setIsReceiveDialogOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />รับของเข้าคลัง
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
