import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, AlertTriangle, Package, Clock, Truck, CheckCircle } from "lucide-react";
import { useState } from "react";

type Notification = {
  id: number;
  type: "low_stock" | "expiring" | "po_pending" | "po_received" | "system";
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
};

// Mock notifications - จะเชื่อมต่อกับ API จริงในภายหลัง
const mockNotifications: Notification[] = [
  {
    id: 1,
    type: "low_stock",
    title: "สินค้าใกล้หมด",
    message: "Straumann BLX Implant เหลือเพียง 5 ชิ้น ต่ำกว่าระดับขั้นต่ำ",
    createdAt: new Date(),
    isRead: false,
  },
  {
    id: 2,
    type: "expiring",
    title: "สินค้าใกล้หมดอายุ",
    message: "Bio-Oss Granules 0.5g Lot#BIO-2024-001 จะหมดอายุใน 15 วัน",
    createdAt: new Date(Date.now() - 86400000),
    isRead: false,
  },
  {
    id: 3,
    type: "po_pending",
    title: "ใบสั่งซื้อรอรับของ",
    message: "PO2602-0001 จาก Straumann Thailand ยังไม่ได้รับของ (เกินกำหนด 2 วัน)",
    createdAt: new Date(Date.now() - 172800000),
    isRead: true,
  },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const getIcon = (type: string) => {
    switch (type) {
      case "low_stock": return <Package className="w-5 h-5 text-orange-500" />;
      case "expiring": return <Clock className="w-5 h-5 text-red-500" />;
      case "po_pending": return <Truck className="w-5 h-5 text-blue-500" />;
      case "po_received": return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const getBadge = (type: string) => {
    switch (type) {
      case "low_stock": return <Badge variant="outline" className="bg-orange-50 text-orange-700">สต็อกต่ำ</Badge>;
      case "expiring": return <Badge variant="outline" className="bg-red-50 text-red-700">หมดอายุ</Badge>;
      case "po_pending": return <Badge variant="outline" className="bg-blue-50 text-blue-700">รอรับของ</Badge>;
      case "po_received": return <Badge variant="outline" className="bg-green-50 text-green-700">รับของแล้ว</Badge>;
      default: return <Badge variant="outline">ระบบ</Badge>;
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">การแจ้งเตือน</h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0 ? `มี ${unreadCount} รายการที่ยังไม่ได้อ่าน` : "ไม่มีการแจ้งเตือนใหม่"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="w-4 h-4 mr-2" />
              อ่านทั้งหมด
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {notifications.filter(n => n.type === "low_stock" && !n.isRead).length}
                  </div>
                  <p className="text-xs text-muted-foreground">สินค้าใกล้หมด</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-red-500" />
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {notifications.filter(n => n.type === "expiring" && !n.isRead).length}
                  </div>
                  <p className="text-xs text-muted-foreground">ใกล้หมดอายุ</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Truck className="w-8 h-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {notifications.filter(n => n.type === "po_pending" && !n.isRead).length}
                  </div>
                  <p className="text-xs text-muted-foreground">รอรับของ</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {notifications.filter(n => n.type === "po_received" && !n.isRead).length}
                  </div>
                  <p className="text-xs text-muted-foreground">รับของแล้ว</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              รายการแจ้งเตือนทั้งหมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.length > 0 ? notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                    notification.isRead ? "bg-white" : "bg-indigo-50 border-indigo-200"
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-slate-900">{notification.title}</h4>
                      {getBadge(notification.type)}
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {notification.createdAt.toLocaleString('th-TH')}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4" />
                  <p>ไม่มีการแจ้งเตือน</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
