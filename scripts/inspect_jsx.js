// =====================================================
// Tool สำหรับตรวจสอบ JSX/JS source
// นับสัญลักษณ์และแสดงพื้นที่รอบ ๆ บรรทัดที่คาดว่ามีโครงสร้างผิดปกติ
// =====================================================




const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '..', 'frontend', 'src', 'pages', 'admin', 'Activities.jsx');
const s = fs.readFileSync(file, 'utf8');
// ==============================
// ส่วนคำนวณโครงสร้าง JSX / JS
// ==============================
const counts = { '{':0, '}':0, '(':0, ')':0, '[':0, ']':0, '<':0, '>':0 };
for (const ch of s) if (counts.hasOwnProperty(ch)) counts[ch]++;
console.log('Counts:', counts);
// ==============================
// ส่วนแสดงบรรทัดล่าสุดและจุดที่คาดว่ามีปัญหา
// ==============================
const lines = s.split(/\r?\n/);
for (let i=Math.max(0, lines.length-40); i<lines.length; i++) {
  console.log((i+1).toString().padStart(4,' ')+': '+lines[i]);
}
// show a window around line with error candidate (line ~324)
const L=324;
for (let i=Math.max(0,L-6); i<=Math.min(lines.length, L+6); i++) {
  const ln = lines[i-1] || '';
  console.log((i).toString().padStart(4,' ')+': '+ln);
}