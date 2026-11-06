// =====================================================
// Script รีเซ็ตรหัสผ่านผู้ดูแลระบบหลัก
// ใช้สำหรับตั้งค่า password เริ่มต้นสำหรับบัญชี admin ในสภาพแวดล้อมพัฒนา
// =====================================================




const bcrypt = require("bcrypt");
const db = require("./config/db");

async function resetPassword() {
    try {
        const hash = await bcrypt.hash("123456", 10);

        await db.query(
            "UPDATE admins SET password = ? WHERE username = ?",
            [hash, "admin"]
        );

        console.log("Password reset success!");
        console.log("Username : admin");
        console.log("Password : 123456");

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

resetPassword();