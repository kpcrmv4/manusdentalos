import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Package,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Calendar,
  ShoppingCart,
  Activity,
  BarChart3,
  PieChart,
  Users,
  FileText,
  Clock,
} from "lucide-react";
import { useState } from "react";

export default function AdminDashboard() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());

  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: monthlyCost } = trpc.dashboard.monthlyCost.useQuery({
    year: parseInt(selectedYear),
    month: parseInt(selectedMonth),
  });
  const { data: products } = trpc.products.list.useQuery();
  const { data: inventory } = trpc.inventory.list.useQuery();
  const { data: lowStock } = trpc.inventory.getLowStock.useQuery();
  const { data: expiringSoon } = trpc.inventory.getExpiringSoon.useQuery({ daysAhead: 30 });
  const { data: recentAuditLogs } = trpc.auditLogs.list.useQuery({ limit: 10 });
  const { data: surgeryCases } = trpc.surgeryCases.list.useQuery();

  // คำนวณ inventory value
  const inventoryValue = inventory?.reduce((sum, lot) => {
    return sum + (parseFloat(lot.physicalQty) * parseFloat(lot.costPrice || "0"));
  }, 0) || 0;

  // Top 5 materials used this month
  const topMaterials = stats?.topMaterials || [];

  // Recent surgery cases
  const recentCases = surgeryCases?.slice(0, 5) || [];

  const months = [
    { value: "1", label: "มกราคม" },
    { value: "2", label: "กุมภาพันธ์" },
    { value: "3", label: "มีนาคม" },
    { value: "4", label: "เมษายน" },
    { value: "5", label: "พฤษภาคม" },
    { value: "6", label: "มิถุนายน" },
    { value: "7", label: "กรกฎาคม" },
    { value: "8", label: "สิงหาคม" },
    { value: "9", label: "กันยายน" },
    { value: "10", label: "ตุลาคม" },
    { value: "11", label: "พฤศจิกายน" },
    { value: "12", label: "ธันวาคม" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create': return 'สร้าง';
      case 'update': return 'แก้ไข';
      case 'delete': return 'ลบ';
      default: return action;
    }
  };

  const getTableLabel = (table: string) => {
    const labels: Record<string, string> = {
      products: 'สินค้า',
      categories: 'หมวดหมู่',
      suppliers: 'Supplier',
      inventoryLots: 'Lot สินค้า',
      purchaseOrders: 'ใบสั่งซื้อ',
      reservations: 'การจอง',
      surgeryCases: 'เคสผ่าตัด',
      usageLogs: 'การใช้วัสดุ',
      users: 'ผู้ใช้งาน',
    };
    return labels[table] || table;
  };

  const getMaterialStatusBadge = (status: string) => {
    switch (status) {
      case 'green':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">พร้อม</span>;
      case 'yellow':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">บางส่วน</span>;
      case 'red':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">ไม่พร้อม</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">-</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">ภาพรวมระบบจัดการคลังวัสดุทางการแพทย์</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">สินค้าทั้งหมด</p>
                  <div className="text-3xl font-bold">{stats?.totalProducts || products?.length || 0}</div>
                </div>
                <Package className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">มูลค่าคลัง</p>
                  <div className="text-3xl font-bold">฿{(inventoryValue / 1000).toFixed(0)}K</div>
                </div>
                <DollarSign className="w-10 h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">สินค้าใกล้หมด</p>
                  <div className="text-3xl font-bold">{stats?.lowStockCount || lowStock?.length || 0}</div>
                </div>
                <AlertTriangle className="w-10 h-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">ใกล้หมดอายุ</p>
                  <div className="text-3xl font-bold">{stats?.expiringSoonCount || expiringSoon?.length || 0}</div>
                </div>
                <Clock className="w-10 h-10 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">PO รอดำเนินการ</p>
                  <div className="text-3xl font-bold">{stats?.pendingPOCount || 0}</div>
                </div>
                <ShoppingCart className="w-10 h-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm">เคสเดือนนี้</p>
                  <div className="text-3xl font-bold">{stats?.casesThisMonth || 0}</div>
                </div>
                <Calendar className="w-10 h-10 text-indigo-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
            <TabsTrigger value="cost">ต้นทุน</TabsTrigger>
            <TabsTrigger value="audit">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Top Materials Used */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    วัสดุที่ใช้มากที่สุด (เดือนนี้)
                  </CardTitle>
                  <CardDescription>Top 5 วัสดุที่มีการใช้งานมากที่สุดในเดือนนี้</CardDescription>
                </CardHeader>
                <CardContent>
                  {topMaterials.length > 0 ? (
                    <div className="space-y-4">
                      {topMaterials.map((item: any, index: number) => {
                        const product = products?.find(p => p.id === item.productId);
                        const maxUsed = Math.max(...topMaterials.map((m: any) => m.totalUsed || 0));
                        const percentage = maxUsed > 0 ? ((item.totalUsed || 0) / maxUsed) * 100 : 0;

                        return (
                          <div key={item.productId} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">
                                {index + 1}. {product?.name || `Product #${item.productId}`}
                              </span>
                              <span className="text-muted-foreground">{item.totalUsed || 0} ชิ้น</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                      <p>ยังไม่มีข้อมูลการใช้วัสดุ</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Surgery Cases */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    เคสผ่าตัดล่าสุด
                  </CardTitle>
                  <CardDescription>5 เคสผ่าตัดล่าสุดในระบบ</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentCases.length > 0 ? (
                    <div className="space-y-3">
                      {recentCases.map((caseItem) => (
                        <div key={caseItem.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <div className="font-medium">{caseItem.patientName}</div>
                            <div className="text-sm text-muted-foreground">
                              {caseItem.surgeryType || 'ไม่ระบุประเภท'} |{' '}
                              {new Date(caseItem.surgeryDate).toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </div>
                          </div>
                          {getMaterialStatusBadge(caseItem.materialStatus)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-2" />
                      <p>ยังไม่มีเคสผ่าตัด</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Low Stock & Expiring Soon */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="w-5 h-5" />
                    สินค้าใกล้หมด
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lowStock && lowStock.length > 0 ? (
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ชื่อสินค้า</TableHead>
                            <TableHead className="text-center">คงเหลือ</TableHead>
                            <TableHead className="text-center">ขั้นต่ำ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lowStock.slice(0, 5).map((item: any) => (
                            <TableRow key={item.product.id}>
                              <TableCell className="font-medium">{item.product.name}</TableCell>
                              <TableCell className="text-center text-red-600 font-bold">
                                {item.totalAvailable || 0}
                              </TableCell>
                              <TableCell className="text-center">{item.product.minStockLevel}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-2 text-green-500" />
                      <p className="text-green-600">ไม่มีสินค้าใกล้หมด</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <Clock className="w-5 h-5" />
                    Lot ใกล้หมดอายุ (30 วัน)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {expiringSoon && expiringSoon.length > 0 ? (
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Lot No.</TableHead>
                            <TableHead>หมดอายุ</TableHead>
                            <TableHead className="text-center">คงเหลือ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expiringSoon.slice(0, 5).map((lot) => {
                            const product = products?.find(p => p.id === lot.productId);
                            const daysLeft = lot.expiryDate
                              ? Math.ceil((new Date(lot.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                              : 0;

                            return (
                              <TableRow key={lot.id}>
                                <TableCell>
                                  <div className="font-medium">{lot.lotNumber}</div>
                                  <div className="text-xs text-muted-foreground">{product?.name}</div>
                                </TableCell>
                                <TableCell>
                                  <span className={daysLeft <= 7 ? 'text-red-600 font-bold' : 'text-orange-600'}>
                                    {daysLeft} วัน
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">{lot.availableQty}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-2 text-green-500" />
                      <p className="text-green-600">ไม่มี Lot ใกล้หมดอายุ</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cost" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      รายงานต้นทุนรายเดือน
                    </CardTitle>
                    <CardDescription>วิเคราะห์ต้นทุนวัสดุที่ใช้ในแต่ละเคส</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year.value} value={year.value}>
                            {year.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {monthlyCost && monthlyCost.length > 0 ? (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <Card className="bg-blue-50">
                        <CardContent className="pt-4">
                          <div className="text-2xl font-bold text-blue-600">
                            ฿{monthlyCost.reduce((sum: number, item: any) => sum + (item.totalCost || 0), 0).toLocaleString()}
                          </div>
                          <p className="text-sm text-muted-foreground">ต้นทุนรวม</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-50">
                        <CardContent className="pt-4">
                          <div className="text-2xl font-bold text-green-600">
                            {monthlyCost.length}
                          </div>
                          <p className="text-sm text-muted-foreground">จำนวนเคส</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-purple-50">
                        <CardContent className="pt-4">
                          <div className="text-2xl font-bold text-purple-600">
                            ฿{(monthlyCost.reduce((sum: number, item: any) => sum + (item.totalCost || 0), 0) / (monthlyCost.length || 1)).toLocaleString()}
                          </div>
                          <p className="text-sm text-muted-foreground">เฉลี่ย/เคส</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead>วันที่</TableHead>
                            <TableHead>ชื่อผู้ป่วย</TableHead>
                            <TableHead className="text-right">ต้นทุนวัสดุ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {monthlyCost.map((item: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>
                                {item.date
                                  ? new Date(item.date).toLocaleDateString('th-TH', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : '-'}
                              </TableCell>
                              <TableCell className="font-medium">{item.patientName || '-'}</TableCell>
                              <TableCell className="text-right font-medium">
                                ฿{(item.totalCost || 0).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <PieChart className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-lg">ไม่มีข้อมูลต้นทุนในเดือนนี้</p>
                    <p className="text-sm">เลือกเดือนอื่นหรือรอให้มีการบันทึกการใช้วัสดุ</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Activity Log
                </CardTitle>
                <CardDescription>บันทึกการเปลี่ยนแปลงล่าสุดในระบบ</CardDescription>
              </CardHeader>
              <CardContent>
                {recentAuditLogs && recentAuditLogs.length > 0 ? (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead>วันเวลา</TableHead>
                          <TableHead>การดำเนินการ</TableHead>
                          <TableHead>ประเภทข้อมูล</TableHead>
                          <TableHead>รายละเอียด</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentAuditLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm">
                              {new Date(log.createdAt).toLocaleString('th-TH', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  log.action === 'create'
                                    ? 'bg-green-100 text-green-700'
                                    : log.action === 'update'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {getActionLabel(log.action)}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium">{getTableLabel(log.tableName)}</TableCell>
                            <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                              {log.newValues ? (
                                <span title={log.newValues}>
                                  {log.newValues.substring(0, 50)}...
                                </span>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-lg">ยังไม่มี Activity Log</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
