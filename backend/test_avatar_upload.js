// =====================================================
// Script ทดสอบการอัปโหลด avatar ให้กับสมาชิก
// ส่ง request ไปยัง API เพื่อยืนยันการจัดเก็บภาพและสร้างบัญชีผู้ใช้ใหม่
// =====================================================




const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const fetch = global.fetch || require('node-fetch');
const FormData = require('form-data');
(async () => {
  try {
    const filePath = path.join(__dirname, 'uploads', 'activities', '1782545891319.jfif');
    if (!fs.existsSync(filePath)) {
      console.error('Test file missing:', filePath);
      process.exit(1);
    }
    const form = new FormData();
    form.append('avatar', fs.createReadStream(filePath));

    const uploadRes = await fetch('http://localhost:5000/api/members/avatar', {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
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
    console.log('create payload:', body);

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