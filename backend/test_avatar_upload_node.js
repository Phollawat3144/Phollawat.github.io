// =====================================================
// Script ทดสอบ upload avatar แบบ Node
// ใช้ fetch/form-data และตรวจสอบ flow ของการอัปโหลดและการสร้างสมาชิก
// =====================================================




const fs = require('fs');
const path = require('path');
(async () => {
  try {
    const filePath = path.join(__dirname, 'uploads', 'activities', '1782545891319.jfif');
    if (!fs.existsSync(filePath)) {
      throw new Error('Test file missing: ' + filePath);
    }
    const form = new FormData();
    form.append('avatar', fs.createReadStream(filePath));
    const uploadRes = await fetch('http://localhost:5000/api/members/avatar', {
      method: 'POST',
      body: form,
      headers: form.getHeaders ? form.getHeaders() : undefined,
    });
    const uploadJson = await uploadRes.json();
    console.log('uploadJson:', uploadJson);
    const body = {
      first_name: 'testavatar',
      last_name: 'user',
      email: `testavatar.user${Date.now()}@example.com`,
      phone: '0123456789',
      password: 'password123',
      role: 'member',
      avatar: uploadJson.path,
    };
    const createRes = await fetch('http://localhost:5000/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const createJson = await createRes.text();
    console.log('createJson:', createJson);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();