import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Search, Edit, Package, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Form state
  const [formData, setFormData] = useState({
    productCode: "",
    name: "",
    refCode: "",
    brand: "",
    model: "",
    size: "",
    categoryId: "",
    unit: "ชิ้น",
    minStockLevel: 0,
    description: "",
  });

  const { data: products, refetch } = trpc.products.list.useQuery(
    selectedCategory !== "all" ? { categoryId: parseInt(selectedCategory) } : undefined
  );
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: searchResults } = trpc.products.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("เพิ่มสินค้าสำเร็จ");
      setIsAddDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createCategory = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success("เพิ่มหมวดหมู่สำเร็จ");
    },
  });

  const resetForm = () => {
    setFormData({
      productCode: "",
      name: "",
      refCode: "",
      brand: "",
      model: "",
      size: "",
      categoryId: "",
      unit: "ชิ้น",
      minStockLevel: 0,
      description: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.productCode || !formData.name) {
      toast.error("กรุณากรอกรหัสสินค้าและชื่อสินค้า");
      return;
    }

    createProduct.mutate({
      ...formData,
      categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
    });
  };

  const handleSearchBeforeAdd = () => {
    if (searchResults && searchResults.length > 0) {
      toast.warning("พบสินค้าที่คล้ายกันในระบบ กรุณาตรวจสอบก่อนเพิ่มใหม่");
    } else if (searchQuery.length > 0) {
      setIsSearchDialogOpen(false);
      setIsAddDialogOpen(true);
      setFormData(prev => ({ ...prev, name: searchQuery }));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">จัดการสินค้า</h1>
            <p className="text-muted-foreground mt-1">
              ระบบจัดการข้อมูลสินค้าและ Product Master
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Search className="w-4 h-4 mr-2" />
                  ค้นหาก่อนเพิ่ม
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>ค้นหาสินค้าก่อนเพิ่มใหม่</DialogTitle>
                  <DialogDescription>
                    ค้นหาเพื่อตรวจสอบว่ามีสินค้านี้ในระบบแล้วหรือไม่
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="ค้นหาด้วยชื่อ, รหัส, REF, Brand หรือ Model..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button onClick={handleSearchBeforeAdd}>
                      ค้นหา
                    </Button>
                  </div>
                  
                  {searchResults && searchResults.length > 0 && (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>รหัส</TableHead>
                            <TableHead>ชื่อสินค้า</TableHead>
                            <TableHead>REF</TableHead>
                            <TableHead>Brand</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {searchResults.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell className="font-mono">{product.productCode}</TableCell>
                              <TableCell>{product.name}</TableCell>
                              <TableCell>{product.refCode || "-"}</TableCell>
                              <TableCell>{product.brand || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {searchQuery && searchResults?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                      <p>ไม่พบสินค้าที่คล้ายกัน สามารถเพิ่มสินค้าใหม่ได้</p>
                      <Button className="mt-4" onClick={() => {
                        setIsSearchDialogOpen(false);
                        setIsAddDialogOpen(true);
                        setFormData(prev => ({ ...prev, name: searchQuery }));
                      }}>
                        <Plus className="w-4 h-4 mr-2" />
                        เพิ่มสินค้าใหม่
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มสินค้า
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>เพิ่มสินค้าใหม่</DialogTitle>
                  <DialogDescription>
                    กรอกข้อมูลสินค้าที่ต้องการเพิ่มในระบบ
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productCode">รหัสสินค้า *</Label>
                    <Input
                      id="productCode"
                      value={formData.productCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, productCode: e.target.value }))}
                      placeholder="เช่น IMP-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">ชื่อสินค้า *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="เช่น Straumann BLX Implant"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="refCode">REF Code</Label>
                    <Input
                      id="refCode"
                      value={formData.refCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, refCode: e.target.value }))}
                      placeholder="รหัสอ้างอิงจาก Supplier"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">หมวดหมู่</Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกหมวดหมู่" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="เช่น Straumann"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="เช่น BLX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">Size</Label>
                    <Input
                      id="size"
                      value={formData.size}
                      onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                      placeholder="เช่น 4.0x10mm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">หน่วยนับ</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="เช่น ชิ้น, กล่อง"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minStockLevel">ระดับสต็อกขั้นต่ำ</Label>
                    <Input
                      id="minStockLevel"
                      type="number"
                      value={formData.minStockLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, minStockLevel: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="description">รายละเอียด</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="รายละเอียดเพิ่มเติม"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button onClick={handleSubmit} disabled={createProduct.isPending}>
                    {createProduct.isPending ? "กำลังบันทึก..." : "บันทึก"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="ค้นหาสินค้า..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[120px]">รหัสสินค้า</TableHead>
                    <TableHead>ชื่อสินค้า</TableHead>
                    <TableHead>REF</TableHead>
                    <TableHead>Brand / Model</TableHead>
                    <TableHead>หมวดหมู่</TableHead>
                    <TableHead className="text-center">สต็อกขั้นต่ำ</TableHead>
                    <TableHead className="text-center">สถานะ</TableHead>
                    <TableHead className="w-[100px]">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products && products.length > 0 ? (
                    products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-sm">{product.productCode}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-muted-foreground">{product.refCode || "-"}</TableCell>
                        <TableCell>
                          {product.brand && product.model 
                            ? `${product.brand} / ${product.model}`
                            : product.brand || product.model || "-"
                          }
                        </TableCell>
                        <TableCell>
                          {categories?.find(c => c.id === product.categoryId)?.name || "-"}
                        </TableCell>
                        <TableCell className="text-center">{product.minStockLevel}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={product.isActive ? "default" : "secondary"}>
                            {product.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Package className="w-12 h-12" />
                          <p>ยังไม่มีข้อมูลสินค้า</p>
                          <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            เพิ่มสินค้าแรก
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
