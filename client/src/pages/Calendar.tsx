import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  User,
  Stethoscope,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";

type MaterialStatus = 'green' | 'yellow' | 'red';

interface SurgeryCase {
  id: number;
  caseNumber: string;
  patientName: string;
  patientId?: string | null;
  surgeryDate: Date;
  surgeryType?: string | null;
  dentistName?: string | null;
  status: string;
  materialStatus: MaterialStatus;
  notes?: string | null;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<SurgeryCase | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    caseNumber: "",
    patientName: "",
    patientId: "",
    surgeryDate: "",
    surgeryType: "",
    dentistName: "",
    notes: "",
  });

  // Get first and last day of current month for query
  const monthStart = useMemo(() => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    return date;
  }, [currentDate]);

  const monthEnd = useMemo(() => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
    return date;
  }, [currentDate]);

  const { data: surgeryCases = [], refetch } = trpc.surgeryCases.list.useQuery({
    startDate: monthStart,
    endDate: monthEnd,
  });

  const { data: products = [] } = trpc.products.list.useQuery();

  const createCaseMutation = trpc.surgeryCases.create.useMutation({
    onSuccess: () => {
      toast.success("สร้างเคสผ่าตัดสำเร็จ");
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const reserveMaterialsMutation = trpc.surgeryCases.reserveMaterials.useMutation({
    onSuccess: (data) => {
      toast.success(`จองวัสดุสำเร็จ สถานะ: ${getStatusText(data.materialStatus)}`);
      refetch();
    },
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      caseNumber: "",
      patientName: "",
      patientId: "",
      surgeryDate: "",
      surgeryType: "",
      dentistName: "",
      notes: "",
    });
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getCasesForDate = (day: number) => {
    return surgeryCases.filter((c: SurgeryCase) => {
      const caseDate = new Date(c.surgeryDate);
      return (
        caseDate.getDate() === day &&
        caseDate.getMonth() === currentDate.getMonth() &&
        caseDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const getStatusColor = (status: MaterialStatus) => {
    switch (status) {
      case 'green':
        return 'bg-green-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'red':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: MaterialStatus) => {
    switch (status) {
      case 'green':
        return 'วัสดุพร้อม';
      case 'yellow':
        return 'วัสดุบางส่วน';
      case 'red':
        return 'วัสดุไม่พร้อม';
      default:
        return 'ไม่ทราบสถานะ';
    }
  };

  const getStatusIcon = (status: MaterialStatus) => {
    switch (status) {
      case 'green':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'yellow':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'red':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const handleCreateCase = () => {
    if (!formData.caseNumber || !formData.patientName || !formData.surgeryDate) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็น");
      return;
    }

    createCaseMutation.mutate({
      caseNumber: formData.caseNumber,
      patientName: formData.patientName,
      patientId: formData.patientId || undefined,
      surgeryDate: new Date(formData.surgeryDate),
      surgeryType: formData.surgeryType || undefined,
      dentistName: formData.dentistName || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleReserveMaterials = (caseId: number) => {
    reserveMaterialsMutation.mutate({ caseId });
  };

  const monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);
  const today = new Date();

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ปฏิทินเคสผ่าตัด</h1>
          <p className="text-slate-500">จัดการและติดตามเคสผ่าตัดพร้อมสถานะวัสดุ</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              สร้างเคสใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>สร้างเคสผ่าตัดใหม่</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>เลขที่เคส *</Label>
                  <Input
                    value={formData.caseNumber}
                    onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                    placeholder="CASE-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>รหัสผู้ป่วย</Label>
                  <Input
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    placeholder="HN-12345"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>ชื่อผู้ป่วย *</Label>
                <Input
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  placeholder="ชื่อ-นามสกุล"
                />
              </div>
              <div className="space-y-2">
                <Label>วันที่ผ่าตัด *</Label>
                <Input
                  type="datetime-local"
                  value={formData.surgeryDate}
                  onChange={(e) => setFormData({ ...formData, surgeryDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ประเภทการผ่าตัด</Label>
                <Input
                  value={formData.surgeryType}
                  onChange={(e) => setFormData({ ...formData, surgeryType: e.target.value })}
                  placeholder="เช่น Implant, Extraction"
                />
              </div>
              <div className="space-y-2">
                <Label>ทันตแพทย์</Label>
                <Input
                  value={formData.dentistName}
                  onChange={(e) => setFormData({ ...formData, dentistName: e.target.value })}
                  placeholder="ชื่อทันตแพทย์"
                />
              </div>
              <div className="space-y-2">
                <Label>หมายเหตุ</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="รายละเอียดเพิ่มเติม"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button 
                  onClick={handleCreateCase}
                  disabled={createCaseMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {createCaseMutation.isPending ? "กำลังสร้าง..." : "สร้างเคส"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Traffic Light Legend */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-sm font-medium text-slate-700">สถานะวัสดุ:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm text-slate-600">วัสดุพร้อม</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span className="text-sm text-slate-600">วัสดุบางส่วน</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm text-slate-600">วัสดุไม่พร้อม</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold min-w-[180px] text-center">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
                </h2>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={goToToday}>
                วันนี้
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {dayNames.map((day, index) => (
                <div
                  key={day}
                  className={`text-center text-sm font-medium py-2 ${
                    index === 0 ? "text-red-500" : "text-slate-600"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="h-24"></div>;
                }

                const cases = getCasesForDate(day);
                const isToday =
                  day === today.getDate() &&
                  currentDate.getMonth() === today.getMonth() &&
                  currentDate.getFullYear() === today.getFullYear();

                return (
                  <div
                    key={day}
                    className={`h-24 border rounded-lg p-1 cursor-pointer transition-colors ${
                      isToday
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                    onClick={() => {
                      const clickedDate = new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth(),
                        day
                      );
                      setSelectedDate(clickedDate);
                    }}
                  >
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isToday ? "text-indigo-600" : "text-slate-700"
                      }`}
                    >
                      {day}
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      {cases.slice(0, 2).map((c: SurgeryCase) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-1 text-xs truncate"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCase(c);
                          }}
                        >
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(
                              c.materialStatus
                            )}`}
                          ></div>
                          <span className="truncate">{c.patientName}</span>
                        </div>
                      ))}
                      {cases.length > 2 && (
                        <div className="text-xs text-slate-500">
                          +{cases.length - 2} เคส
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Side Panel - Selected Date or Case Details */}
        <div className="space-y-4">
          {selectedCase ? (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">รายละเอียดเคส</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCase(null)}
                  >
                    ปิด
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedCase.materialStatus)}
                  <Badge
                    variant={
                      selectedCase.materialStatus === "green"
                        ? "default"
                        : selectedCase.materialStatus === "yellow"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {getStatusText(selectedCase.materialStatus)}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">เลขที่เคส</p>
                      <p className="text-sm text-slate-600">
                        {selectedCase.caseNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">ผู้ป่วย</p>
                      <p className="text-sm text-slate-600">
                        {selectedCase.patientName}
                        {selectedCase.patientId && ` (${selectedCase.patientId})`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">วันที่ผ่าตัด</p>
                      <p className="text-sm text-slate-600">
                        {new Date(selectedCase.surgeryDate).toLocaleDateString(
                          "th-TH",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  {selectedCase.surgeryType && (
                    <div className="flex items-start gap-3">
                      <Stethoscope className="h-4 w-4 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">ประเภทการผ่าตัด</p>
                        <p className="text-sm text-slate-600">
                          {selectedCase.surgeryType}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedCase.dentistName && (
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">ทันตแพทย์</p>
                        <p className="text-sm text-slate-600">
                          {selectedCase.dentistName}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 space-y-2">
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => handleReserveMaterials(selectedCase.id)}
                    disabled={
                      reserveMaterialsMutation.isPending ||
                      selectedCase.materialStatus === "green"
                    }
                  >
                    <Package className="h-4 w-4 mr-2" />
                    {reserveMaterialsMutation.isPending
                      ? "กำลังจองวัสดุ..."
                      : selectedCase.materialStatus === "green"
                      ? "วัสดุพร้อมแล้ว"
                      : "จองวัสดุ"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : selectedDate ? (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {selectedDate.toLocaleDateString("th-TH", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDate(null)}
                  >
                    ปิด
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {getCasesForDate(selectedDate.getDate()).length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    ไม่มีเคสในวันนี้
                  </p>
                ) : (
                  <div className="space-y-3">
                    {getCasesForDate(selectedDate.getDate()).map(
                      (c: SurgeryCase) => (
                        <div
                          key={c.id}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => setSelectedCase(c)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              {c.caseNumber}
                            </span>
                            <div
                              className={`w-3 h-3 rounded-full ${getStatusColor(
                                c.materialStatus
                              )}`}
                            ></div>
                          </div>
                          <p className="text-sm text-slate-600">
                            {c.patientName}
                          </p>
                          {c.surgeryType && (
                            <p className="text-xs text-slate-500 mt-1">
                              {c.surgeryType}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">เคสวันนี้</CardTitle>
              </CardHeader>
              <CardContent>
                {getCasesForDate(today.getDate()).length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    ไม่มีเคสวันนี้
                  </p>
                ) : (
                  <div className="space-y-3">
                    {getCasesForDate(today.getDate()).map((c: SurgeryCase) => (
                      <div
                        key={c.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => setSelectedCase(c)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">
                            {c.caseNumber}
                          </span>
                          <div
                            className={`w-3 h-3 rounded-full ${getStatusColor(
                              c.materialStatus
                            )}`}
                          ></div>
                        </div>
                        <p className="text-sm text-slate-600">{c.patientName}</p>
                        {c.surgeryType && (
                          <p className="text-xs text-slate-500 mt-1">
                            {c.surgeryType}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Summary Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">สรุปเดือนนี้</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {surgeryCases.filter((c: SurgeryCase) => c.materialStatus === "green").length}
                  </p>
                  <p className="text-xs text-slate-500">พร้อม</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {surgeryCases.filter((c: SurgeryCase) => c.materialStatus === "yellow").length}
                  </p>
                  <p className="text-xs text-slate-500">บางส่วน</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {surgeryCases.filter((c: SurgeryCase) => c.materialStatus === "red").length}
                  </p>
                  <p className="text-xs text-slate-500">ไม่พร้อม</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
