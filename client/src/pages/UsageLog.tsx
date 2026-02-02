import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ClipboardList, Plus, Search, Calendar, Package, User, Camera, FileText, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function UsageLog() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");

  // Form states
  const [formLotId, setFormLotId] = useState("");
  const [formUsedQty, setFormUsedQty] = useState("");
  const [formPatientName, setFormPatientName] = useState("");
  const [formSurgeryDate, setFormSurgeryDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formPhotoEvidence, setFormPhotoEvidence] = useState("");

  const { data: usageLogs, refetch } = trpc.usageLogs.list.useQuery({
    startDate: dateFrom ? new Date(dateFrom) : undefined,
    endDate: dateTo ? new Date(dateTo) : undefined,
  });

  const { data: products } = trpc.products.list.useQuery();
  const { data: inventory } = trpc.inventory.list.useQuery();

  const createUsageLogMutation = trpc.usageLogs.create.useMutation({
    onSuccess: () => {
      toast.success("บันทึกการใช้วัสดุเรียบร้อยแล้ว");
      setIsDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormLotId("");
    setFormUsedQty("");
    setFormPatientName("");
    setFormSurgeryDate("");
    setFormNotes("");
    setFormPhotoEvidence("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formLotId || !formUsedQty) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    createUsageLogMutation.mutate({
      lotId: parseInt(formLotId),
      usedQty: parseFloat(formUsedQty),
      patientName: formPatientName || undefined,
      surgeryDate: formSurgeryDate ? new Date(formSurgeryDate) : undefined,
      notes: formNotes || undefined,
      photoEvidence: formPhotoEvidence || undefined,
    });
  };

  const handleExport = () => {
    if (!usageLogs || usageLogs.length === 0) {
      toast.error("ไม่มีข้อมูลให้ส่งออก");
      return;
    }

    // Create CSV content
    const headers = ["วันที่", "ชื่อผู้ป่วย", "Lot No.", "จำนวนที่ใช้", "หมายเหตุ"];
    const rows = usageLogs.map(log => {
      const lot = inventory?.find(l => l.id === log.lotId);
      return [
        log.surgeryDate ? new Date(log.surgeryDate).toLocaleDateString('th-TH') : '-',
        log.patientName || '-',
        lot?.lotNumber || '-',
        log.usedQty,
        log.notes || '-'
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `usage-log-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success("ส่งออกข้อมูลเรียบร้อยแล้ว");
  };

  // Get product and lot info for display
  const getLotInfo = (lotId: number) => {
    const lot = inventory?.find(l => l.id === lotId);
    if (!lot) return { lotNumber: '-', productName: '-', productCode: '-' };

    const product = products?.find(p => p.id === lot.productId);
    return {
      lotNumber: lot.lotNumber,
      productName: product?.name || '-',
      productCode: product?.productCode || '-',
    };
  };

  // Filter logs based on search and product selection
  const filteredLogs = usageLogs?.filter(log => {
    const lotInfo = getLotInfo(log.lotId);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !log.patientName?.toLowerCase().includes(query) &&
        !lotInfo.lotNumber.toLowerCase().includes(query) &&
        !lotInfo.productName.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    if (selectedProduct && selectedProduct !== "all") {
      const lot = inventory?.find(l => l.id === log.lotId);
      if (lot?.productId !== parseInt(selectedProduct)) {
        return false;
      }
    }

    return true;
  });

  // Get lots filtered by selected product for the form
  const availableLots = selectedProduct && selectedProduct !== "all"
    ? inventory?.filter(lot => lot.productId === parseInt(selectedProduct) && parseFloat(lot.physicalQty) > 0)
    : inventory?.filter(lot => parseFloat(lot.physicalQty) > 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">บันทึกการใช้วัสดุ</h1>
            <p className="text-muted-foreground mt-1">บันทึกและติดตามการใช้วัสดุในแต่ละเคส</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                บันทึกการใช้งาน
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>บันทึกการใช้วัสดุ</DialogTitle>
                <DialogDescription>กรอกข้อมูลการใช้วัสดุสำหรับผู้ป่วย</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>สินค้า *</Label>
                    <Select
                      value={selectedProduct}
                      onValueChange={(value) => {
                        setSelectedProduct(value);
                        setFormLotId("");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกสินค้า" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทุกสินค้า</SelectItem>
                        {products?.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.productCode} - {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Lot Number *</Label>
                    <Select value={formLotId} onValueChange={setFormLotId}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือก Lot" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLots?.map((lot) => {
                          const product = products?.find(p => p.id === lot.productId);
                          return (
                            <SelectItem key={lot.id} value={lot.id.toString()}>
                              {lot.lotNumber} - {product?.name} (คงเหลือ: {lot.physicalQty})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>จำนวนที่ใช้ *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formUsedQty}
                      onChange={(e) => setFormUsedQty(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>วันที่ผ่าตัด</Label>
                    <Input
                      type="date"
                      value={formSurgeryDate}
                      onChange={(e) => setFormSurgeryDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>ชื่อผู้ป่วย</Label>
                  <Input
                    value={formPatientName}
                    onChange={(e) => setFormPatientName(e.target.value)}
                    placeholder="กรอกชื่อผู้ป่วย"
                  />
                </div>

                <div className="space-y-2">
                  <Label>รูปหลักฐาน (URL)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formPhotoEvidence}
                      onChange={(e) => setFormPhotoEvidence(e.target.value)}
                      placeholder="URL รูปภาพหลักฐาน"
                    />
                    <Button type="button" variant="outline" size="icon">
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>หมายเหตุ</Label>
                  <Textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="บันทึกเพิ่มเติม"
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button type="submit" disabled={createUsageLogMutation.isPending}>
                    {createUsageLogMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-indigo-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-8 h-8 text-indigo-600" />
                <div>
                  <div className="text-2xl font-bold text-indigo-600">{usageLogs?.length || 0}</div>
                  <p className="text-sm text-muted-foreground">รายการทั้งหมด</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {usageLogs?.filter(l => {
                      const today = new Date().toDateString();
                      return l.surgeryDate && new Date(l.surgeryDate).toDateString() === today;
                    }).length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">วันนี้</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Package className="w-8 h-8 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {usageLogs?.reduce((sum, log) => sum + parseFloat(log.usedQty), 0).toFixed(0) || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">จำนวนที่ใช้รวม</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <User className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {new Set(usageLogs?.map(l => l.patientName).filter(Boolean)).size || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">ผู้ป่วย</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              ค้นหาและกรอง
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>ค้นหา</Label>
                <Input
                  placeholder="ค้นหาจากชื่อผู้ป่วย, Lot No., ชื่อสินค้า..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>จากวันที่</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>ถึงวันที่</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>สินค้า</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="ทุกสินค้า" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสินค้า</SelectItem>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                ส่งออก CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Usage Log Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              รายการบันทึกการใช้วัสดุ
            </CardTitle>
            <CardDescription>
              แสดง {filteredLogs?.length || 0} รายการ จากทั้งหมด {usageLogs?.length || 0} รายการ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>วันที่</TableHead>
                    <TableHead>ชื่อผู้ป่วย</TableHead>
                    <TableHead>รหัสสินค้า</TableHead>
                    <TableHead>ชื่อสินค้า</TableHead>
                    <TableHead>Lot No.</TableHead>
                    <TableHead className="text-center">จำนวน</TableHead>
                    <TableHead>หลักฐาน</TableHead>
                    <TableHead>หมายเหตุ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs && filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => {
                      const lotInfo = getLotInfo(log.lotId);
                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            {log.surgeryDate
                              ? new Date(log.surgeryDate).toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '-'}
                          </TableCell>
                          <TableCell className="font-medium">{log.patientName || '-'}</TableCell>
                          <TableCell className="font-mono text-sm">{lotInfo.productCode}</TableCell>
                          <TableCell>{lotInfo.productName}</TableCell>
                          <TableCell className="font-mono text-sm">{lotInfo.lotNumber}</TableCell>
                          <TableCell className="text-center font-medium">{log.usedQty}</TableCell>
                          <TableCell>
                            {log.photoEvidence ? (
                              <a
                                href={log.photoEvidence}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <Camera className="w-4 h-4" />
                                ดูรูป
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {log.notes || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        <ClipboardList className="w-12 h-12 mx-auto mb-2" />
                        <p>ไม่พบข้อมูลการใช้วัสดุ</p>
                        <p className="text-sm">กดปุ่ม "บันทึกการใช้งาน" เพื่อเพิ่มรายการใหม่</p>
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
