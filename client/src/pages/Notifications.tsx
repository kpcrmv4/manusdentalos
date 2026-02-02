import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  Bell,
  BellOff,
  Check,
  AlertTriangle,
  Package,
  Clock,
  Truck,
  CheckCircle,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type NotificationType = "low_stock" | "expiring" | "expiring_soon" | "expired" | "po_pending" | "po_received" | "pending_order" | "slow_moving" | "system";

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  relatedTable?: string | null;
  relatedId?: number | null;
}

// Mock notifications สำหรับ demo
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
    type: "expiring_soon",
    title: "สินค้าใกล้หมดอายุ",
    message: "Bio-Oss Granules 0.5g Lot#BIO-2024-001 จะหมดอายุใน 15 วัน",
    createdAt: new Date(Date.now() - 86400000),
    isRead: false,
  },
  {
    id: 3,
    type: "pending_order",
    title: "ใบสั่งซื้อรอรับของ",
    message: "PO2602-0001 จาก Straumann Thailand ยังไม่ได้รับของ (เกินกำหนด 2 วัน)",
    createdAt: new Date(Date.now() - 172800000),
    isRead: true,
  },
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading: isPushLoading,
    subscribe,
    unsubscribe,
    showLocalNotification,
  } = usePushNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case "low_stock":
        return <Package className="w-5 h-5 text-orange-500" />;
      case "expiring":
      case "expiring_soon":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "expired":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "po_pending":
      case "pending_order":
        return <Truck className="w-5 h-5 text-blue-500" />;
      case "po_received":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "slow_moving":
        return <Package className="w-5 h-5 text-gray-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const getBadge = (type: string) => {
    switch (type) {
      case "low_stock":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">สต็อกต่ำ</Badge>;
      case "expiring":
      case "expiring_soon":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">ใกล้หมดอายุ</Badge>;
      case "expired":
        return <Badge variant="destructive">หมดอายุ</Badge>;
      case "po_pending":
      case "pending_order":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">รอรับของ</Badge>;
      case "po_received":
        return <Badge variant="outline" className="bg-green-50 text-green-700">รับของแล้ว</Badge>;
      case "slow_moving":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">ค้างสต็อก</Badge>;
      default:
        return <Badge variant="outline">ระบบ</Badge>;
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleTogglePush = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast.success("ปิดการแจ้งเตือน Push สำเร็จ");
      } else {
        toast.error("เกิดข้อผิดพลาดในการปิดการแจ้งเตือน");
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast.success("เปิดการแจ้งเตือน Push สำเร็จ");
        showLocalNotification("DentalFlow OS", {
          body: "การแจ้งเตือน Push เปิดใช้งานแล้ว!",
        });
      } else {
        if (permission === "denied") {
          toast.error("กรุณาอนุญาตการแจ้งเตือนในการตั้งค่าเบราว์เซอร์");
        } else {
          toast.error("เกิดข้อผิดพลาดในการเปิดการแจ้งเตือน");
        }
      }
    }
  };

  const handleTestNotification = () => {
    showLocalNotification("ทดสอบการแจ้งเตือน", {
      body: "นี่คือการแจ้งเตือนทดสอบจาก DentalFlow OS",
    });
    toast.success("ส่งการแจ้งเตือนทดสอบแล้ว");
  };

  const filteredNotifications = activeTab === "unread" 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">การแจ้งเตือน</h1>
          <p className="text-slate-500">
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {notifications.filter(n => n.type === "low_stock" && !n.isRead).length}
                </div>
                <p className="text-xs text-slate-600">สินค้าใกล้หมด</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {notifications.filter(n => (n.type === "expiring" || n.type === "expiring_soon") && !n.isRead).length}
                </div>
                <p className="text-xs text-slate-600">ใกล้หมดอายุ</p>
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
                  {notifications.filter(n => (n.type === "po_pending" || n.type === "pending_order") && !n.isRead).length}
                </div>
                <p className="text-xs text-slate-600">รอรับของ</p>
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
                <p className="text-xs text-slate-600">รับของแล้ว</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  รายการแจ้งเตือน
                </CardTitle>
                {unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount} ยังไม่อ่าน</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
                  <TabsTrigger value="unread">ยังไม่อ่าน</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-0">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-12">
                      <BellOff className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">ไม่มีการแจ้งเตือน</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                            notification.isRead
                              ? "bg-white border-slate-200"
                              : "bg-indigo-50 border-indigo-200"
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
                            <p className="text-sm text-slate-600">{notification.message}</p>
                            <p className="text-xs text-slate-500 mt-2">
                              {notification.createdAt.toLocaleString('th-TH')}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Settings Panel */}
        <div className="space-y-4">
          {/* PWA Push Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Push Notification
              </CardTitle>
              <CardDescription>
                รับการแจ้งเตือนแม้ไม่ได้เปิดแอป
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isSupported ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <XCircle className="h-4 w-4 text-red-500" />
                  เบราว์เซอร์ไม่รองรับ Push Notification
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>เปิดการแจ้งเตือน Push</Label>
                      <p className="text-xs text-slate-500">
                        {isSubscribed ? "เปิดใช้งานอยู่" : "ปิดอยู่"}
                      </p>
                    </div>
                    <Switch
                      checked={isSubscribed}
                      onCheckedChange={handleTogglePush}
                      disabled={isPushLoading}
                    />
                  </div>

                  {permission === "denied" && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        การแจ้งเตือนถูกบล็อก กรุณาอนุญาตในการตั้งค่าเบราว์เซอร์
                      </p>
                    </div>
                  )}

                  {isSubscribed && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleTestNotification}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      ทดสอบการแจ้งเตือน
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Notification Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ประเภทการแจ้งเตือน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">สินค้าใกล้หมด</span>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">สินค้าใกล้หมดอายุ</span>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">สินค้าหมดอายุ</span>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">ใบสั่งซื้อรอรับ</span>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">สินค้าค้างสต็อก</span>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* PWA Install Prompt */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                ติดตั้งแอป
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-3">
                ติดตั้ง DentalFlow OS เป็นแอปบนอุปกรณ์ของคุณเพื่อเข้าถึงได้ง่ายขึ้น
              </p>
              <div className="text-xs text-slate-500 space-y-1">
                <p><strong>iOS:</strong> กด Share → Add to Home Screen</p>
                <p><strong>Android:</strong> กด Menu → Install App</p>
                <p><strong>Desktop:</strong> กดไอคอนติดตั้งในแถบ URL</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
