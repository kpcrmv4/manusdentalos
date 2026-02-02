# DentalFlow OS - TODO List

## Phase 1: Database Schema และโครงสร้างพื้นฐาน
- [x] สร้าง Database Schema สำหรับ Product Master
- [x] สร้าง Database Schema สำหรับ Inventory Lots
- [x] สร้าง Database Schema สำหรับ Suppliers
- [x] สร้าง Database Schema สำหรับ Purchase Orders
- [x] สร้าง Database Schema สำหรับ Goods Receipt
- [x] สร้าง Database Schema สำหรับ Reservations
- [x] สร้าง Database Schema สำหรับ Audit Trail
- [x] สร้าง Database Schema สำหรับ Notifications
- [x] ตั้งค่าธีม Clinical Indigo/Slate
- [x] ตั้งค่าฟอนต์ภาษาไทย

## Phase 2: Product Master และ Inventory Core
- [ ] สร้างหน้าจัดการ Product Master (CRUD)
- [ ] เพิ่มฟังก์ชันค้นหาสินค้าก่อนเพิ่มใหม่
- [ ] สร้างหน้าจัดการ Inventory Lots
- [ ] สร้าง Reservation Logic (reserve, commit, cancel)
- [ ] เพิ่ม Concurrency Control
- [ ] เพิ่ม FEFO Logic

## Phase 3: Procurement Suite
- [ ] สร้างหน้าจัดการ Suppliers
- [ ] สร้างหน้าสร้าง Purchase Order
- [ ] สร้างหน้าติดตาม Purchase Order
- [ ] สร้างหน้ารับของเข้าคลัง (Goods Receipt)
- [ ] เพิ่มการกรองตาม Supplier และ Category
- [ ] เพิ่มหน้าสรุปก่อนยืนยันการรับของ

## Phase 4: Monitoring และ Notifications
- [ ] สร้าง Dashboard แสดงสถานะสต็อก
- [ ] เพิ่มการแจ้งเตือนสินค้าใกล้หมด
- [ ] เพิ่มการแจ้งเตือนสินค้าหมดอายุ
- [ ] เพิ่มการแจ้งเตือน PO ที่ยังไม่ได้รับของ
- [ ] เพิ่มรายงาน Slow-Moving Stock

## Phase 5: Reporting และ Dashboard
- [ ] สร้างรายงานการรับเข้าสินค้า (ค้นหาจาก Invoice)
- [ ] สร้างรายงานการใช้วัสดุรายวัน/รายเดือน
- [ ] สร้างรายงานต้นทุนต่อเคส
- [ ] สร้าง Dashboard หลักพร้อม Traffic Light
- [ ] เพิ่มปฏิทินแสดงเคสผ่าตัด

## Phase 6: Testing และ Deployment
- [ ] เขียน Unit Tests สำหรับ Core Logic
- [ ] ทดสอบ Reservation Concurrency
- [ ] ทดสอบ FEFO Logic
- [ ] ทดสอบ Responsive Design
- [ ] Push โค้ดขึ้น GitHub
- [ ] เตรียม Deploy บน Vercel
