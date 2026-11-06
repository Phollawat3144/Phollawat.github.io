// =====================================================
// Script ทดสอบการอัปโหลดรูปภาพของสมาชิก
// ใช้จริงกับ API member upload ในสภาพแวดล้อม local server
// =====================================================




const fs = require('fs');

(async () => {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: 'member@example.com', password: 'Member1234!', role: 'member' })
    });

    const loginJson = await loginRes.json();
    console.log('login response:', loginJson);
    const token = loginJson.token || loginJson.data?.token || loginJson.accessToken || loginJson.token || (loginJson.success && loginJson.token);

    if (!token) {
      console.error('No token received; aborting upload');
      process.exit(1);
    }

    // use curl.exe to upload the file with Authorization header (safer for multipart in this environment)
    const { execSync } = require('child_process');
    const cmd = `curl.exe -s -X POST "http://localhost:5000/api/gallery/15/upload" -H "Authorization: Bearer ${token}" -F "images=@tmp_test.png" -F "description=Test upload from member (script)" -F "activity_date=2026-08-07" -F "start_time=10:00" -F "end_time=11:00"`;
    try {
      const out = execSync(cmd, { encoding: 'utf8' });
      console.log('curl response:', out);
    } catch (e) {
      console.error('curl failed:', e.message, e.stdout && e.stdout.toString());
      process.exit(1);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();