import DashboardLayout from "@/components/DashboardLayout";

export default function PurchaseOrders() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">ใบสั่งซื้อ</h1>
          <p className="text-muted-foreground mt-2">
            ระบบจัดการใบสั่งซื้อและการรับของเข้าคลัง
          </p>
        </div>
        
        <div className="bg-card p-8 rounded-lg border">
          <p className="text-center text-muted-foreground">
            หน้านี้อยู่ระหว่างการพัฒนา
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
