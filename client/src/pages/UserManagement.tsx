import DashboardLayout from "@/components/DashboardLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Users, UserPlus, Shield, Edit, Trash2, Search, UserCheck, UserX, Building } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type UserRole = 'admin' | 'manager' | 'assistant' | 'viewer';

interface UserFormData {
  id?: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  isActive: boolean;
}

const roleLabels: Record<UserRole, string> = {
  admin: 'ผู้ดูแลระบบ',
  manager: 'ผู้จัดการ',
  assistant: 'ผู้ช่วย',
  viewer: 'ผู้ชม',
};

const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-blue-100 text-blue-700',
  assistant: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-700',
};

const roleDescriptions: Record<UserRole, string> = {
  admin: 'เข้าถึงได้ทุกฟังก์ชัน รวมถึงการจัดการผู้ใช้',
  manager: 'จัดการคลังสินค้า, PO, รายงาน แต่ไม่รวมการจัดการผู้ใช้',
  assistant: 'บันทึกการใช้วัสดุ, ดูข้อมูล แต่แก้ไขบางส่วนเท่านั้น',
  viewer: 'ดูข้อมูลได้อย่างเดียว ไม่สามารถแก้ไขได้',
};

export default function UserManagement() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserFormData | null>(null);

  // Form states
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    phone: "",
    role: "viewer",
    department: "",
    isActive: true,
  });

  const { data: users, refetch } = trpc.users.list.useQuery({
    role: roleFilter !== "all" ? roleFilter : undefined,
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
  });

  const updateUserMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success("อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว");
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteUserMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("ปิดใช้งานผู้ใช้เรียบร้อยแล้ว");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setFormData({
      id: user.id,
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "viewer",
      department: user.department || "",
      isActive: user.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id) {
      toast.error("ไม่พบข้อมูลผู้ใช้");
      return;
    }

    updateUserMutation.mutate({
      id: formData.id,
      name: formData.name || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      role: formData.role,
      department: formData.department || undefined,
      isActive: formData.isActive,
    });
  };

  const handleDeleteUser = (userId: number) => {
    deleteUserMutation.mutate({ id: userId });
  };

  // Filter users
  const filteredUsers = users?.filter((user) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !user.name?.toLowerCase().includes(query) &&
        !user.email?.toLowerCase().includes(query) &&
        !user.department?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    return true;
  });

  // Stats
  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter((u) => u.isActive).length || 0;
  const adminCount = users?.filter((u) => u.role === 'admin').length || 0;
  const managerCount = users?.filter((u) => u.role === 'manager').length || 0;

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">จัดการผู้ใช้งาน</h1>
            <p className="text-muted-foreground mt-1">จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึงระบบ</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-indigo-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-indigo-600" />
                <div>
                  <div className="text-2xl font-bold text-indigo-600">{totalUsers}</div>
                  <p className="text-sm text-muted-foreground">ผู้ใช้ทั้งหมด</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <UserCheck className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
                  <p className="text-sm text-muted-foreground">ใช้งานอยู่</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{adminCount}</div>
                  <p className="text-sm text-muted-foreground">ผู้ดูแลระบบ</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Building className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{managerCount}</div>
                  <p className="text-sm text-muted-foreground">ผู้จัดการ</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role Descriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              ระดับสิทธิ์การเข้าถึง (RBAC)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                <div key={role} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={roleColors[role]}>{roleLabels[role]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{roleDescriptions[role]}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              ค้นหาและกรอง
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>ค้นหา</Label>
                <Input
                  placeholder="ค้นหาจากชื่อ, อีเมล, แผนก..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>ระดับสิทธิ์</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกระดับ</SelectItem>
                    {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>สถานะ</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value="active">ใช้งานอยู่</SelectItem>
                    <SelectItem value="inactive">ปิดใช้งาน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              รายชื่อผู้ใช้งาน
            </CardTitle>
            <CardDescription>
              แสดง {filteredUsers?.length || 0} รายการ จากทั้งหมด {users?.length || 0} รายการ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>ผู้ใช้</TableHead>
                    <TableHead>อีเมล</TableHead>
                    <TableHead>แผนก</TableHead>
                    <TableHead>ระดับสิทธิ์</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>เข้าสู่ระบบล่าสุด</TableHead>
                    <TableHead className="text-right">การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers && filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.avatar || undefined} />
                              <AvatarFallback className="bg-indigo-100 text-indigo-600">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name || "ไม่ระบุชื่อ"}</div>
                              {user.phone && (
                                <div className="text-sm text-muted-foreground">{user.phone}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email || "-"}</TableCell>
                        <TableCell>{user.department || "-"}</TableCell>
                        <TableCell>
                          <Badge className={roleColors[user.role as UserRole]}>
                            {roleLabels[user.role as UserRole]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge className="bg-green-100 text-green-700">ใช้งานอยู่</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-700">ปิดใช้งาน</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.lastSignedIn
                            ? new Date(user.lastSignedIn).toLocaleDateString("th-TH", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {user.isActive && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>ยืนยันการปิดใช้งาน</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      คุณต้องการปิดใช้งานบัญชี "{user.name}" หรือไม่?
                                      ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้จนกว่าจะเปิดใช้งานอีกครั้ง
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() => handleDeleteUser(user.id)}
                                    >
                                      ปิดใช้งาน
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        <UserX className="w-12 h-12 mx-auto mb-2" />
                        <p>ไม่พบผู้ใช้งาน</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>แก้ไขข้อมูลผู้ใช้</DialogTitle>
              <DialogDescription>อัปเดตข้อมูลและสิทธิ์การเข้าถึงของผู้ใช้</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>ชื่อ-นามสกุล</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="กรอกชื่อ-นามสกุล"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>อีเมล</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>เบอร์โทร</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0XX-XXX-XXXX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>แผนก</Label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="ชื่อแผนก"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ระดับสิทธิ์</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                        <SelectItem key={role} value={role}>
                          {roleLabels[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>สถานะการใช้งาน</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.isActive ? "ผู้ใช้สามารถเข้าสู่ระบบได้" : "ผู้ใช้ถูกปิดใช้งาน"}
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
