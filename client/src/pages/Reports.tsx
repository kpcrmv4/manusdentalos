import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { FileText, Download, Search, Calendar, Package, TrendingUp, DollarSign } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("receipt");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const { data: categories } = trpc.categories.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  const { data: inventory } = trpc.inventory.list.useQuery();

  const handleExport = (reportType: string) => {
    toast.info(`กำลังส่งออกรายงาน ${reportType}...`);
    // TODO: Implement export functionality
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">รายงาน</h1>
          <p className="text-muted-foreground mt-1">ดูและส่งออกรายงานต่างๆ ของระบบ</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="receipt">รายงานการรับเข้า</TabsTrigger>
            <TabsTrigger value="usage">รายงานการใช้วัสดุ</TabsTrigger>
            <TabsTrigger value="cost">ต้นทุนต่อเคส</TabsTrigger>
            <TabsTrigger value="stock">สรุปสต็อก</TabsTrigger>
          </TabsList>

          <TabsContent value="receipt" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  รายงานการรับเข้าสินค้า
                </CardTitle>
                <CardDescription>ค้นหาและตรวจสอบประวัติการรับเข้าสินค้าจากเลขที่ Invoice</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>ค้นหาจากเลขที่ Invoice</Label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        placeholder="INV-XXXXX" 
                        value={invoiceSearch} 
                        onChange={(e) => setInvoiceSearch(e.target.value)} 
                      />
                      <Button><Search className="w-4 h-4 mr-2" />ค้นหา</Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>ช่วงวันที่</Label>
                    <div className="flex gap-2">
                      <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                      <span className="self-center">-</span>
                      <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => handleExport('receipt')}>
                    <Download className="w-4 h-4 mr-2" />ส่งออก Excel
                  </Button>
                </div>

                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>วันที่รับ</TableHead>
                        <TableHead>เลขที่ Invoice</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>สินค้า</TableHead>
                        <TableHead>Lot No.</TableHead>
                        <TableHead className="text-center">จำนวน</TableHead>
                        <TableHead className="text-right">ราคา/หน่วย</TableHead>
                        <TableHead className="text-right">รวม</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                          <FileText className="w-12 h-12 mx-auto mb-2" />
                          <p>ไม่พบข้อมูล กรุณาค้นหาจากเลขที่ Invoice หรือเลือกช่วงวันที่</p>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  รายงานการใช้วัสดุ
                </CardTitle>
                <CardDescription>ดูรายงานการใช้วัสดุรายวัน/รายเดือน แยกตามผู้ป่วย หมวดหมู่ หรือประเภทวัสดุ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label>ช่วงวันที่</Label>
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>ถึงวันที่</Label>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>หมวดหมู่</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger><SelectValue placeholder="ทุกหมวดหมู่" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                        {categories?.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>ประเภทรายงาน</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">รายวัน</SelectItem>
                        <SelectItem value="monthly">รายเดือน</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button>
                    <Search className="w-4 h-4 mr-2" />ดูรายงาน
                  </Button>
                  <Button variant="outline" onClick={() => handleExport('usage')}>
                    <Download className="w-4 h-4 mr-2" />ส่งออก Excel
                  </Button>
                </div>

                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>วันที่</TableHead>
                        <TableHead>ชื่อผู้ป่วย</TableHead>
                        <TableHead>หมวดหมู่</TableHead>
                        <TableHead>สินค้า</TableHead>
                        <TableHead>Lot No.</TableHead>
                        <TableHead className="text-center">จำนวนที่ใช้</TableHead>
                        <TableHead className="text-right">ต้นทุน</TableHead>
                        <TableHead>ผู้บันทึก</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                          <Calendar className="w-12 h-12 mx-auto mb-2" />
                          <p>เลือกช่วงวันที่และกดดูรายงาน</p>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cost" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  รายงานต้นทุนต่อเคส
                </CardTitle>
                <CardDescription>วิเคราะห์ต้นทุนวัสดุที่ใช้ในแต่ละเคสผ่าตัด</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label>ช่วงวันที่</Label>
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>ถึงวันที่</Label>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full">
                      <Search className="w-4 h-4 mr-2" />ดูรายงาน
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => handleExport('cost')}>
                    <Download className="w-4 h-4 mr-2" />ส่งออก Excel
                  </Button>
                </div>

                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>วันที่ผ่าตัด</TableHead>
                        <TableHead>ชื่อผู้ป่วย</TableHead>
                        <TableHead>ประเภทเคส</TableHead>
                        <TableHead className="text-center">จำนวนวัสดุ</TableHead>
                        <TableHead className="text-right">ต้นทุนรวม</TableHead>
                        <TableHead>ทันตแพทย์</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                          <DollarSign className="w-12 h-12 mx-auto mb-2" />
                          <p>เลือกช่วงวันที่และกดดูรายงาน</p>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  สรุปสต็อกคงเหลือ
                </CardTitle>
                <CardDescription>ดูภาพรวมสต็อกสินค้าทั้งหมดในระบบ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <Card className="bg-indigo-50">
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-indigo-600">{products?.length || 0}</div>
                      <p className="text-sm text-muted-foreground">สินค้าทั้งหมด</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50">
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-green-600">{inventory?.length || 0}</div>
                      <p className="text-sm text-muted-foreground">Lot ทั้งหมด</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-50">
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-orange-600">0</div>
                      <p className="text-sm text-muted-foreground">สินค้าใกล้หมด</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-50">
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-red-600">0</div>
                      <p className="text-sm text-muted-foreground">ใกล้หมดอายุ</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => handleExport('stock')}>
                    <Download className="w-4 h-4 mr-2" />ส่งออก Excel
                  </Button>
                </div>

                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>รหัสสินค้า</TableHead>
                        <TableHead>ชื่อสินค้า</TableHead>
                        <TableHead>หมวดหมู่</TableHead>
                        <TableHead className="text-center">จำนวน Lot</TableHead>
                        <TableHead className="text-center">คงเหลือรวม</TableHead>
                        <TableHead className="text-center">จองแล้ว</TableHead>
                        <TableHead className="text-center">พร้อมใช้</TableHead>
                        <TableHead className="text-right">มูลค่า</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products && products.length > 0 ? products.map((product) => {
                        const productLots = inventory?.filter((lot: any) => lot.productId === product.id) || [];
                        const totalPhysical = productLots.reduce((sum: number, lot: typeof productLots[0]) => sum + parseFloat(lot.physicalQty), 0);
                        const totalReserved = productLots.reduce((sum: number, lot: typeof productLots[0]) => sum + parseFloat(lot.reservedQty), 0);
                        const totalAvailable = productLots.reduce((sum: number, lot: typeof productLots[0]) => sum + parseFloat(lot.availableQty), 0);
                        const totalValue = productLots.reduce((sum: number, lot: typeof productLots[0]) => sum + (parseFloat(lot.physicalQty) * parseFloat(lot.costPrice || "0")), 0);
                        
                        return (
                          <TableRow key={product.id}>
                            <TableCell className="font-mono">{product.productCode}</TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{categories?.find(c => c.id === product.categoryId)?.name || "-"}</TableCell>
                            <TableCell className="text-center">{productLots.length}</TableCell>
                            <TableCell className="text-center">{totalPhysical}</TableCell>
                            <TableCell className="text-center">{totalReserved}</TableCell>
                            <TableCell className="text-center font-medium text-green-600">{totalAvailable}</TableCell>
                            <TableCell className="text-right">฿{totalValue.toLocaleString()}</TableCell>
                          </TableRow>
                        );
                      }) : (
                        <TableRow>
                          <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                            <Package className="w-12 h-12 mx-auto mb-2" />
                            <p>ยังไม่มีข้อมูลสินค้าในระบบ</p>
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
