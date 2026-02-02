import DashboardLayout from "@/components/DashboardLayout";

export default function Inventory() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">จัดการสต็อก</h1>
          <p className="text-muted-foreground mt-2">
            ระบบจัดการ Inventory Lots และการจองสินค้า
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
