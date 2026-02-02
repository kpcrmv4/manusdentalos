import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, ShoppingCart, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { data: lowStockProducts } = trpc.inventory.getLowStock.useQuery();
  const { data: expiringSoon } = trpc.inventory.getExpiringSoon.useQuery({ daysAhead: 30 });
  const { data: pendingOrders } = trpc.purchaseOrders.list.useQuery({ status: "pending" });

  const stats = [
    {
      title: "สินค้าใกล้หมด",
      value: lowStockProducts?.length || 0,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "ใกล้หมดอายุ (30 วัน)",
      value: expiringSoon?.length || 0,
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "ใบสั่งซื้อรอรับ",
      value: pendingOrders?.length || 0,
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "มูลค่าคงคลัง",
      value: "฿0",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">แดชบอร์ด</h1>
          <p className="text-muted-foreground mt-2">
            ภาพรวมระบบจัดการคลังวัสดุทางการแพทย์
          </p>
        </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>สินค้าใกล้หมด</CardTitle>
            <CardDescription>รายการสินค้าที่ต่ำกว่าระดับขั้นต่ำ</CardDescription>
          </CardHeader>
          <CardContent>
            {!lowStockProducts || lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">ไม่มีสินค้าใกล้หมด</p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.slice(0, 5).map((item: any) => (
                  <div key={item.product.id} className="flex justify-between items-center">
                    <span className="text-sm">{item.product.name}</span>
                    <span className="text-sm font-medium text-red-600">
                      เหลือ {item.totalAvailable} {item.product.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ใกล้หมดอายุ</CardTitle>
            <CardDescription>รายการที่จะหมดอายุใน 30 วัน</CardDescription>
          </CardHeader>
          <CardContent>
            {!expiringSoon || expiringSoon.length === 0 ? (
              <p className="text-sm text-muted-foreground">ไม่มีรายการใกล้หมดอายุ</p>
            ) : (
              <div className="space-y-2">
                {expiringSoon.slice(0, 5).map((lot: any) => (
                  <div key={lot.id} className="flex justify-between items-center">
                    <span className="text-sm">Lot {lot.lotNumber}</span>
                    <span className="text-sm text-orange-600">
                      {lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString('th-TH') : '-'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </DashboardLayout>
  );
}
