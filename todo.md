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
- [x] สร้างหน้าจัดการ Product Master (CRUD)
- [x] เพิ่มฟังก์ชันค้นหาสินค้าก่อนเพิ่มใหม่
- [x] สร้างหน้าจัดการ Inventory Lots
- [x] สร้าง Reservation Logic (reserve, commit, cancel)
- [x] เพิ่ม Concurrency Control
- [x] เพิ่ม FEFO Logic

## Phase 3: Procurement Suite
- [x] สร้างหน้าจัดการ Suppliers
- [x] สร้างหน้าสร้าง Purchase Order
- [x] สร้างหน้าติดตาม Purchase Order
- [x] สร้างหน้ารับของเข้าคลัง (Goods Receipt)
- [x] เพิ่มการกรองตาม Supplier และ Category
- [x] เพิ่มหน้าสรุปก่อนยืนยันการรับของ

## Phase 4: Monitoring และ Notifications
- [x] สร้าง Dashboard แสดงสถานะสต็อก
- [x] เพิ่มการแจ้งเตือนสินค้าใกล้หมด
- [x] เพิ่มการแจ้งเตือนสินค้าหมดอายุ
- [x] เพิ่มการแจ้งเตือน PO ที่ยังไม่ได้รับของ
- [x] เพิ่มรายงาน Slow-Moving Stock

## Phase 5: Reporting และ Dashboard
- [x] สร้างรายงานการรับเข้าสินค้า (ค้นหาจาก Invoice)
- [x] สร้างรายงานการใช้วัสดุรายวัน/รายเดือน
- [x] สร้างรายงานต้นทุนต่อเคส
- [x] สร้าง Dashboard หลักพร้อม Traffic Light

## Phase 6: Testing และ Deployment
- [x] เขียน Unit Tests สำหรับ Core Logic
- [x] Push โค้ดขึ้น GitHub

## Phase 7: ฟีเจอร์เพิ่มเติม
- [x] สร้าง Database Schema สำหรับ Surgery Cases
- [x] สร้าง API สำหรับจัดการเคสผ่าตัด
- [x] สร้างปฏิทินเคสผ่าตัดพร้อม Traffic Light (เขียว/เหลือง/แดง)
- [x] สร้างระบบแจ้งเตือนในแอป (In-App Notifications)
- [x] ตั้งค่า PWA (Progressive Web App)
- [x] สร้างระบบ PWA Push Notification
- [x] สร้างระบบ Export รายงานเป็น Excel
- [x] สร้างระบบ Export รายงานเป็น PDF
