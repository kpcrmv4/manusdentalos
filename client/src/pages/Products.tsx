import DashboardLayout from "@/components/DashboardLayout";

export default function Products() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">จัดการสินค้า</h1>
          <p className="text-muted-foreground mt-2">
            ระบบจัดการข้อมูลสินค้าและ Product Master
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
