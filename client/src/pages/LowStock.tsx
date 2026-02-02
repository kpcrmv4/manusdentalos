import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Package, Clock, TrendingDown } from "lucide-react";

export default function LowStock() {
  const { data: products } = trpc.products.list.useQuery();
  const { data: inventory } = trpc.inventory.list.useQuery();

  // คำนวณสินค้าใกล้หมด
  const lowStockItems = products?.filter(product => {
    const productLots = inventory?.filter((lot: any) => lot.productId === product.id) || [];
    const totalAvailable = productLots.reduce((sum: number, lot: any) => sum + parseFloat(lot.availableQty || "0"), 0);
    return totalAvailable <= (product.minStockLevel || 10);
  }) || [];

  // คำนวณสินค้าใกล้หมดอายุ (ภายใน 30 วัน)
  const expiringItems = inventory?.filter((lot: any) => {
    if (!lot.expiryDate) return false;
    const expiryDate = new Date(lot.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  }) || [];

  // คำนวณสินค้าที่ไม่มีการเคลื่อนไหว (Slow-Moving)
  const slowMovingItems = products?.filter(product => {
    const productLots = inventory?.filter((lot: any) => lot.productId === product.id) || [];
    const totalQty = productLots.reduce((sum: number, lot: any) => sum + parseFloat(lot.physicalQty || "0"), 0);
    // สมมติว่าสินค้าที่มีจำนวนมากกว่า 50 และไม่มีการเคลื่อนไหว
    return totalQty > 50;
  }) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">สินค้าใกล้หมด / แจ้งเตือน</h1>
          <p className="text-muted-foreground mt-1">ติดตามสินค้าที่ต้องสั่งซื้อเพิ่ม และสินค้าใกล้หมดอายุ</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">สินค้าใกล้หมด</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
              <p className="text-xs text-muted-foreground">รายการที่ต้องสั่งซื้อ</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ใกล้หมดอายุ</CardTitle>
              <Clock className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{expiringItems.length}</div>
              <p className="text-xs text-muted-foreground">Lot ที่หมดอายุใน 30 วัน</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ไม่มีการเคลื่อนไหว</CardTitle>
              <Package className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{slowMovingItems.length}</div>
              <p className="text-xs text-muted-foreground">Slow-Moving Stock</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              สินค้าใกล้หมด - ต้องสั่งซื้อเพิ่ม
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-orange-50">
                    <TableHead>รหัสสินค้า</TableHead>
                    <TableHead>ชื่อสินค้า</TableHead>
                    <TableHead className="text-center">คงเหลือ</TableHead>
                    <TableHead className="text-center">ขั้นต่ำ</TableHead>
                    <TableHead className="text-center">สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.length > 0 ? lowStockItems.map((product) => {
                    const productLots = inventory?.filter((lot: any) => lot.productId === product.id) || [];
                    const totalAvailable = productLots.reduce((sum: number, lot: any) => sum + parseFloat(lot.availableQty || "0"), 0);
                    const minStock = product.minStockLevel || 10;
                    const isCritical = totalAvailable <= minStock * 0.5;

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono">{product.productCode}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-center font-bold text-orange-600">{totalAvailable}</TableCell>
                        <TableCell className="text-center">{minStock}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={isCritical ? "destructive" : "outline"}>
                            {isCritical ? "วิกฤต" : "ต่ำ"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Clock className="w-5 h-5" />
              สินค้าใกล้หมดอายุ (ภายใน 30 วัน)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-red-50">
                    <TableHead>สินค้า</TableHead>
                    <TableHead>Lot No.</TableHead>
                    <TableHead>วันหมดอายุ</TableHead>
                    <TableHead className="text-center">คงเหลือ</TableHead>
                    <TableHead className="text-center">เหลืออีก</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringItems.length > 0 ? expiringItems.map((lot: any) => {
                    const product = products?.find(p => p.id === lot.productId);
                    const expiryDate = new Date(lot.expiryDate);
                    const today = new Date();
                    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <TableRow key={lot.id}>
                        <TableCell className="font-medium">{product?.name || "-"}</TableCell>
                        <TableCell className="font-mono">{lot.lotNumber}</TableCell>
                        <TableCell>{expiryDate.toLocaleDateString('th-TH')}</TableCell>
                        <TableCell className="text-center">{lot.availableQty}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={daysUntilExpiry <= 7 ? "destructive" : "outline"}>
                            {daysUntilExpiry} วัน
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        ไม่มีสินค้าใกล้หมดอายุ
                      </TableCell>
                    </TableRow>
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
