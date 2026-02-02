/**
 * Script สำหรับสร้าง PWA icons
 *
 * วิธีใช้:
 * 1. ติดตั้ง sharp: pnpm add -D sharp
 * 2. สร้างไฟล์ icon-source.png ขนาด 512x512 ในโฟลเดอร์นี้
 * 3. รัน: node scripts/generate-icons.js
 *
 * หรือใช้เว็บไซต์สร้าง icons:
 * - https://realfavicongenerator.net/
 * - https://www.pwabuilder.com/imageGenerator
 */

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('PWA Icon Generator');
console.log('==================');
console.log('');
console.log('คุณต้องสร้าง icons ขนาดต่อไปนี้ในโฟลเดอร์ client/public/icons/:');
console.log('');
sizes.forEach(size => {
  console.log(`  - icon-${size}x${size}.png`);
});
console.log('');
console.log('วิธีสร้าง:');
console.log('1. ใช้เว็บ https://realfavicongenerator.net/');
console.log('2. หรือใช้ https://www.pwabuilder.com/imageGenerator');
console.log('3. หรือใช้ Figma/Photoshop export เป็น PNG หลายขนาด');
console.log('');
console.log('หรือใช้ sharp (Node.js):');
console.log('');
console.log('const sharp = require("sharp");');
console.log('const sizes = [72, 96, 128, 144, 152, 192, 384, 512];');
console.log('');
console.log('sizes.forEach(size => {');
console.log('  sharp("icon-source.png")');
console.log('    .resize(size, size)');
console.log(`    .toFile(\`client/public/icons/icon-\${size}x\${size}.png\`);`);
console.log('});');
