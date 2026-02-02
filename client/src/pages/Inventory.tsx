import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Plus, Search, Boxes, AlertTriangle, Calendar, Package } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Inventory() {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [isAddLotDialogOpen, setIsAddLotDialogOpen] = useState(false);
  
  // Form state for new lot
  const [lotFormData, setLotFormData] = useState({
    productId: "",
    lotNumber: "",
    expiryDate: "",
    physicalQty: 0,
    costPrice: 0,
    supplierId: "",
    invoiceNo: "",
    refCode: "",
  });

  const { data: products } = trpc.products.list.useQuery();
  const { data: suppliers } = trpc.suppliers.list.useQuery();
  const { data: lowStockProducts } = trpc.inventory.getLowStock.useQuery();
  const { data: expiringSoon } = trpc.inventory.getExpiringSoon.useQuery({ daysAhead: 30 });
  const { data: productLots, refetch: refetchLots } = trpc.inventory.getLotsByProduct.useQuery(
    { productId: parseInt(selectedProduct) },
    { enabled: !!selectedProduct }
  );

  const createLot = trpc.inventory.createLot.useMutation({
    onSuccess: () => {
      toast.success("เพิ่ม Lot สำเร็จ");
      setIsAddLotDialogOpen(false);
      resetLotForm();
      refetchLots();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetLotForm = () => {
    setLotFormData({
      productId: "",
      lotNumber: "",
      expiryDate: "",
      physicalQty: 0,
      costPrice: 0,
      supplierId: "",
      invoiceNo: "",
      refCode: "",
    });
  };

  const handleAddLot = () => {
    if (!lotFormData.productId || !lotFormData.lotNumber || lotFormData.physicalQty <= 0) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    createLot.mutate({
      productId: parseInt(lotFormData.productId),
      lotNumber: lotFormData.lotNumber,
      expiryDate: lotFormData.expiryDate ? new Date(lotFormData.expiryDate) : undefined,
      physicalQty: lotFormData.physicalQty,
      costPrice: lotFormData.costPrice || undefined,
      supplierId: lotFormData.supplierId ? parseInt(lotFormData.supplierId) : undefined,
      invoiceNo: lotFormData.invoiceNo || undefined,
      refCode: lotFormData.refCode || undefined,
    });
  };

  const getExpiryStatus = (expiryDate: Date | null) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { label: "หมดอายุแล้ว", variant: "destructive" as const };
    if (daysUntilExpiry <= 30) return { label: `อีก ${daysUntilExpiry} วัน`, variant: "destructive" as const };
    if (daysUntilExpiry <= 90) return { label: `อีก ${daysUntilExpiry} วัน`, variant: "secondary" as const };
    return { label: `อีก ${daysUntilExpiry} วัน`, variant: "outline" as const };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">จัดการสต็อก</h1>
            <p className="text-muted-foreground mt-1">
              ระบบจัดการ Inventory Lots และการจองสินค้า
            </p>
          </div>
          <Dialog open={isAddLotDialogOpen} onOpenChange={setIsAddLotDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                เพิ่ม Lot ใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>เพิ่ม Inventory Lot ใหม่</DialogTitle>
                <DialogDescription>
                  กรอกข้อมูล Lot สินค้าที่ต้องการเพิ่มในระบบ
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>สินค้า *</Label>
                  <Select
                    value={lotFormData.productId}
                    onValueChange={(value) => setLotFormData(prev => ({ ...prev, productId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกสินค้า" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.productCode} - {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Lot Number *</Label>
                  <Input
                    value={lotFormData.lotNumber}
                    onChange={(e) => setLotFormData(prev => ({ ...prev, lotNumber: e.target.value }))}
                    placeholder="เช่น LOT-2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>วันหมดอายุ</Label>
                  <Input
                    type="date"
                    value={lotFormData.expiryDate}
                    onChange={(e) => setLotFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>จำนวน *</Label>
                  <Input
                    type="number"
                    value={lotFormData.physicalQty}
                    onChange={(e) => setLotFormData(prev => ({ ...prev, physicalQty: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ราคาต้นทุน (บาท)</Label>
                  <Input
                    type="number"
                    value={lotFormData.costPrice}
                    onChange={(e) => setLotFormData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Select
                    value={lotFormData.supplierId}
                    onValueChange={(value) => setLotFormData(prev => ({ ...prev, supplierId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือก Supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>เลขที่ Invoice</Label>
                  <Input
                    value={lotFormData.invoiceNo}
                    onChange={(e) => setLotFormData(prev => ({ ...prev, invoiceNo: e.target.value }))}
                    placeholder="เลขที่ใบส่งของ"
                  />
                </div>
                <div className="space-y-2">
                  <Label>REF Code</Label>
                  <Input
                    value={lotFormData.refCode}
                    onChange={(e) => setLotFormData(prev => ({ ...prev, refCode: e.target.value }))}
                    placeholder="รหัสอ้างอิง"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddLotDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleAddLot} disabled={createLot.isPending}>
                  {createLot.isPending ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">สินค้าใกล้หมด</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{lowStockProducts?.length || 0}</div>
              <p className="text-xs text-muted-foreground">รายการที่ต่ำกว่าระดับขั้นต่ำ</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ใกล้หมดอายุ</CardTitle>
              <Calendar className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{expiringSoon?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Lot ที่จะหมดอายุใน 30 วัน</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">จำนวนสินค้า</CardTitle>
              <Package className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">{products?.length || 0}</div>
              <p className="text-xs text-muted-foreground">รายการในระบบ</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="by-product" className="space-y-4">
          <TabsList>
            <TabsTrigger value="by-product">ดูตามสินค้า</TabsTrigger>
            <TabsTrigger value="low-stock">สินค้าใกล้หมด</TabsTrigger>
            <TabsTrigger value="expiring">ใกล้หมดอายุ</TabsTrigger>
          </TabsList>

          <TabsContent value="by-product">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="w-[400px]">
                      <SelectValue placeholder="เลือกสินค้าเพื่อดู Lots" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.productCode} - {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {selectedProduct ? (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead>Lot Number</TableHead>
                          <TableHead>REF</TableHead>
                          <TableHead className="text-center">Physical Qty</TableHead>
                          <TableHead className="text-center">Available Qty</TableHead>
                          <TableHead className="text-center">Reserved</TableHead>
                          <TableHead>วันหมดอายุ</TableHead>
                          <TableHead className="text-right">ราคาต้นทุน</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productLots && productLots.length > 0 ? (
                          productLots.map((lot) => {
                            const expiryStatus = getExpiryStatus(lot.expiryDate);
                            return (
                              <TableRow key={lot.id}>
                                <TableCell className="font-mono">{lot.lotNumber}</TableCell>
                                <TableCell>{lot.refCode || "-"}</TableCell>
                                <TableCell className="text-center">{lot.physicalQty}</TableCell>
                                <TableCell className="text-center font-medium text-green-600">
                                  {lot.availableQty}
                                </TableCell>
                                <TableCell className="text-center text-orange-600">
                                  {lot.reservedQty}
                                </TableCell>
                                <TableCell>
                                  {lot.expiryDate ? (
                                    <div className="flex items-center gap-2">
                                      <span>{new Date(lot.expiryDate).toLocaleDateString('th-TH')}</span>
                                      {expiryStatus && (
                                        <Badge variant={expiryStatus.variant}>{expiryStatus.label}</Badge>
                                      )}
                                    </div>
                                  ) : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {lot.costPrice ? `฿${parseFloat(lot.costPrice).toLocaleString()}` : "-"}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                              ไม่พบข้อมูล Lot สำหรับสินค้านี้
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <Boxes className="w-12 h-12 mb-2" />
                    <p>เลือกสินค้าเพื่อดูรายการ Lots</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="low-stock">
            <Card>
              <CardHeader>
                <CardTitle>สินค้าใกล้หมด</CardTitle>
                <CardDescription>รายการสินค้าที่มีจำนวนต่ำกว่าระดับขั้นต่ำ</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>รหัสสินค้า</TableHead>
                        <TableHead>ชื่อสินค้า</TableHead>
                        <TableHead className="text-center">จำนวนคงเหลือ</TableHead>
                        <TableHead className="text-center">ระดับขั้นต่ำ</TableHead>
                        <TableHead className="text-center">ต้องสั่งเพิ่ม</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockProducts && lowStockProducts.length > 0 ? (
                        lowStockProducts.map((item: any) => (
                          <TableRow key={item.product.id}>
                            <TableCell className="font-mono">{item.product.productCode}</TableCell>
                            <TableCell>{item.product.name}</TableCell>
                            <TableCell className="text-center font-medium text-red-600">
                              {item.totalAvailable}
                            </TableCell>
                            <TableCell className="text-center">{item.product.minStockLevel}</TableCell>
                            <TableCell className="text-center font-medium text-orange-600">
                              {Math.max(0, item.product.minStockLevel - item.totalAvailable)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            ไม่มีสินค้าใกล้หมด
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expiring">
            <Card>
              <CardHeader>
                <CardTitle>สินค้าใกล้หมดอายุ</CardTitle>
                <CardDescription>Lot ที่จะหมดอายุภายใน 30 วัน (FEFO - First Expired, First Out)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Lot Number</TableHead>
                        <TableHead>สินค้า</TableHead>
                        <TableHead className="text-center">จำนวนคงเหลือ</TableHead>
                        <TableHead>วันหมดอายุ</TableHead>
                        <TableHead>สถานะ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expiringSoon && expiringSoon.length > 0 ? (
                        expiringSoon.map((lot) => {
                          const expiryStatus = getExpiryStatus(lot.expiryDate);
                          return (
                            <TableRow key={lot.id}>
                              <TableCell className="font-mono">{lot.lotNumber}</TableCell>
                              <TableCell>
                                {products?.find(p => p.id === lot.productId)?.name || "-"}
                              </TableCell>
                              <TableCell className="text-center">{lot.availableQty}</TableCell>
                              <TableCell>
                                {lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString('th-TH') : "-"}
                              </TableCell>
                              <TableCell>
                                {expiryStatus && (
                                  <Badge variant={expiryStatus.variant}>{expiryStatus.label}</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            ไม่มี Lot ที่ใกล้หมดอายุ
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
