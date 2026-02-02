import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Bell, Shield, Database, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const [notificationSettings, setNotificationSettings] = useState({
    lowStockAlert: true,
    expiryAlert: true,
    poStatusAlert: true,
    emailNotification: false,
    discordNotification: false,
  });

  const [systemSettings, setSystemSettings] = useState({
    defaultMinStock: 10,
    expiryAlertDays: 30,
    lowStockAlertDays: 7,
  });

  const handleSaveNotifications = () => {
    toast.success("บันทึกการตั้งค่าการแจ้งเตือนสำเร็จ");
  };

  const handleSaveSystem = () => {
    toast.success("บันทึกการตั้งค่าระบบสำเร็จ");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">ตั้งค่าระบบ</h1>
          <p className="text-muted-foreground mt-1">จัดการการตั้งค่าต่างๆ ของระบบ</p>
        </div>

        <Tabs defaultValue="notifications">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications">การแจ้งเตือน</TabsTrigger>
            <TabsTrigger value="system">ระบบ</TabsTrigger>
            <TabsTrigger value="users">ผู้ใช้งาน</TabsTrigger>
            <TabsTrigger value="backup">สำรองข้อมูล</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  การตั้งค่าการแจ้งเตือน
                </CardTitle>
                <CardDescription>กำหนดประเภทการแจ้งเตือนที่ต้องการรับ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>แจ้งเตือนสินค้าใกล้หมด</Label>
                      <p className="text-sm text-muted-foreground">รับการแจ้งเตือนเมื่อสินค้าต่ำกว่าระดับขั้นต่ำ</p>
                    </div>
                    <Switch
                      checked={notificationSettings.lowStockAlert}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, lowStockAlert: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>แจ้งเตือนสินค้าใกล้หมดอายุ</Label>
                      <p className="text-sm text-muted-foreground">รับการแจ้งเตือนเมื่อสินค้าใกล้หมดอายุ</p>
                    </div>
                    <Switch
                      checked={notificationSettings.expiryAlert}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, expiryAlert: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>แจ้งเตือนสถานะใบสั่งซื้อ</Label>
                      <p className="text-sm text-muted-foreground">รับการแจ้งเตือนเมื่อมีการเปลี่ยนแปลงสถานะใบสั่งซื้อ</p>
                    </div>
                    <Switch
                      checked={notificationSettings.poStatusAlert}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, poStatusAlert: checked }))}
                    />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-medium">ช่องทางการแจ้งเตือน</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>แจ้งเตือนทาง Email</Label>
                      <p className="text-sm text-muted-foreground">ส่งการแจ้งเตือนไปยังอีเมลที่ลงทะเบียน</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotification}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotification: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>แจ้งเตือนทาง Discord</Label>
                      <p className="text-sm text-muted-foreground">ส่งการแจ้งเตือนไปยัง Discord Webhook</p>
                    </div>
                    <Switch
                      checked={notificationSettings.discordNotification}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, discordNotification: checked }))}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveNotifications}>บันทึกการตั้งค่า</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5" />
                  การตั้งค่าระบบ
                </CardTitle>
                <CardDescription>กำหนดค่าเริ่มต้นของระบบ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>ระดับสต็อกขั้นต่ำเริ่มต้น</Label>
                    <Input
                      type="number"
                      value={systemSettings.defaultMinStock}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, defaultMinStock: parseInt(e.target.value) || 0 }))}
                    />
                    <p className="text-xs text-muted-foreground">ใช้เมื่อไม่ได้กำหนดค่าเฉพาะสินค้า</p>
                  </div>
                  <div className="space-y-2">
                    <Label>แจ้งเตือนหมดอายุล่วงหน้า (วัน)</Label>
                    <Input
                      type="number"
                      value={systemSettings.expiryAlertDays}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, expiryAlertDays: parseInt(e.target.value) || 0 }))}
                    />
                    <p className="text-xs text-muted-foreground">จำนวนวันก่อนหมดอายุที่จะแจ้งเตือน</p>
                  </div>
                </div>
                <Button onClick={handleSaveSystem}>บันทึกการตั้งค่า</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  จัดการผู้ใช้งาน
                </CardTitle>
                <CardDescription>จัดการสิทธิ์และบทบาทของผู้ใช้งาน</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-4" />
                  <p>ระบบจัดการผู้ใช้งานจะเปิดให้ใช้งานเร็วๆ นี้</p>
                  <p className="text-sm mt-2">ผู้ใช้งานสามารถเข้าสู่ระบบผ่าน Manus OAuth</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  สำรองข้อมูล
                </CardTitle>
                <CardDescription>จัดการการสำรองและกู้คืนข้อมูล</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Database className="w-12 h-12 mx-auto mb-4" />
                  <p>ระบบสำรองข้อมูลอัตโนมัติทำงานอยู่</p>
                  <p className="text-sm mt-2">ข้อมูลถูกสำรองทุกวันเวลา 00:00 น.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
