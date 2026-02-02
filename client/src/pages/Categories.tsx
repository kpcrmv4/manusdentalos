import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Plus, Edit, FolderTree, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Categories() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const { data: categories, refetch } = trpc.categories.list.useQuery();

  const createCategory = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success("เพิ่มหมวดหมู่สำเร็จ");
      setIsAddDialogOpen(false);
      setFormData({ name: "", description: "" });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error("กรุณากรอกชื่อหมวดหมู่");
      return;
    }
    createCategory.mutate(formData);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">หมวดหมู่สินค้า</h1>
            <p className="text-muted-foreground mt-1">จัดการหมวดหมู่สินค้าในระบบ</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มหมวดหมู่
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>เพิ่มหมวดหมู่ใหม่</DialogTitle>
                <DialogDescription>กรอกข้อมูลหมวดหมู่ที่ต้องการเพิ่ม</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>ชื่อหมวดหมู่ *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="เช่น รากฟันเทียม" />
                </div>
                <div className="space-y-2">
                  <Label>คำอธิบาย</Label>
                  <Input value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="คำอธิบายหมวดหมู่" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>ยกเลิก</Button>
                <Button onClick={handleSubmit} disabled={createCategory.isPending}>{createCategory.isPending ? "กำลังบันทึก..." : "บันทึก"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="w-5 h-5" />
              รายการหมวดหมู่ทั้งหมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[80px]">ลำดับ</TableHead>
                    <TableHead>ชื่อหมวดหมู่</TableHead>
                    <TableHead>คำอธิบาย</TableHead>
                    <TableHead>วันที่สร้าง</TableHead>
                    <TableHead className="w-[100px]">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories && categories.length > 0 ? categories.map((cat, index) => (
                    <TableRow key={cat.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell>{cat.description || "-"}</TableCell>
                      <TableCell>{new Date(cat.createdAt).toLocaleDateString('th-TH')}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <FolderTree className="w-12 h-12" />
                          <p>ยังไม่มีหมวดหมู่</p>
                          <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />เพิ่มหมวดหมู่แรก
                          </Button>
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
