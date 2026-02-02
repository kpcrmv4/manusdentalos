import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Edit, Users, Phone, Mail, Building2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Suppliers() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    taxId: "",
    leadTimeDays: 7,
    paymentTerms: "",
    notes: "",
  });

  const { data: suppliers, refetch } = trpc.suppliers.list.useQuery();

  const createSupplier = trpc.suppliers.create.useMutation({
    onSuccess: () => {
      toast.success("เพิ่ม Supplier สำเร็จ");
      setIsAddDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      taxId: "",
      leadTimeDays: 7,
      paymentTerms: "",
      notes: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.code || !formData.name) {
      toast.error("กรุณากรอกรหัสและชื่อ Supplier");
      return;
    }
    createSupplier.mutate(formData);
  };

  const filteredSuppliers = suppliers?.filter(supplier => 
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">ซัพพลายเออร์</h1>
            <p className="text-muted-foreground mt-1">ระบบจัดการข้อมูล Supplier และผู้จัดจำหน่าย</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                เพิ่ม Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>เพิ่ม Supplier ใหม่</DialogTitle>
                <DialogDescription>กรอกข้อมูล Supplier ที่ต้องการเพิ่มในระบบ</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>รหัส Supplier *</Label>
                  <Input value={formData.code} onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))} placeholder="เช่น SUP-001" />
                </div>
                <div className="space-y-2">
                  <Label>ชื่อ Supplier *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="ชื่อบริษัท" />
                </div>
                <div className="space-y-2">
                  <Label>ผู้ติดต่อ</Label>
                  <Input value={formData.contactPerson} onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))} placeholder="ชื่อผู้ติดต่อ" />
                </div>
                <div className="space-y-2">
                  <Label>เบอร์โทรศัพท์</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="02-xxx-xxxx" />
                </div>
                <div className="space-y-2">
                  <Label>อีเมล</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="email@company.com" />
                </div>
                <div className="space-y-2">
                  <Label>เลขประจำตัวผู้เสียภาษี</Label>
                  <Input value={formData.taxId} onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))} placeholder="13 หลัก" />
                </div>
                <div className="space-y-2">
                  <Label>Lead Time (วัน)</Label>
                  <Input type="number" value={formData.leadTimeDays} onChange={(e) => setFormData(prev => ({ ...prev, leadTimeDays: parseInt(e.target.value) || 7 }))} />
                </div>
                <div className="space-y-2">
                  <Label>เงื่อนไขการชำระเงิน</Label>
                  <Input value={formData.paymentTerms} onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))} placeholder="เช่น Credit 30 วัน" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>ที่อยู่</Label>
                  <Input value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} placeholder="ที่อยู่เต็ม" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>ยกเลิก</Button>
                <Button onClick={handleSubmit} disabled={createSupplier.isPending}>{createSupplier.isPending ? "กำลังบันทึก..." : "บันทึก"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Supplier ทั้งหมด</CardTitle>
              <Building2 className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppliers?.length || 0}</div>
              <p className="text-xs text-muted-foreground">รายในระบบ</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ใช้งานอยู่</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{suppliers?.filter(s => s.isActive).length || 0}</div>
              <p className="text-xs text-muted-foreground">Supplier ที่ใช้งาน</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lead Time เฉลี่ย</CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppliers && suppliers.length > 0 ? Math.round(suppliers.reduce((acc, s) => acc + (s.leadTimeDays || 0), 0) / suppliers.length) : 0} วัน</div>
              <p className="text-xs text-muted-foreground">ระยะเวลาจัดส่ง</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <Input placeholder="ค้นหา Supplier..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-sm" />
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[100px]">รหัส</TableHead>
                    <TableHead>ชื่อ Supplier</TableHead>
                    <TableHead>ผู้ติดต่อ</TableHead>
                    <TableHead>เบอร์โทร</TableHead>
                    <TableHead>อีเมล</TableHead>
                    <TableHead className="text-center">Lead Time</TableHead>
                    <TableHead className="text-center">สถานะ</TableHead>
                    <TableHead className="w-[100px]">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers && filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-mono">{supplier.code}</TableCell>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.contactPerson || "-"}</TableCell>
                        <TableCell>{supplier.phone ? <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{supplier.phone}</div> : "-"}</TableCell>
                        <TableCell>{supplier.email ? <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{supplier.email}</div> : "-"}</TableCell>
                        <TableCell className="text-center">{supplier.leadTimeDays} วัน</TableCell>
                        <TableCell className="text-center"><Badge variant={supplier.isActive ? "default" : "secondary"}>{supplier.isActive ? "ใช้งาน" : "ปิดใช้งาน"}</Badge></TableCell>
                        <TableCell><Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Building2 className="w-12 h-12" />
                          <p>ยังไม่มีข้อมูล Supplier</p>
                          <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />เพิ่ม Supplier แรก</Button>
                        </div>
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
