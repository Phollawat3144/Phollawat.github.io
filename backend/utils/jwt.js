// =====================================================
// Utility สำหรับสร้าง JWT
// ใช้ในการลงชื่อเข้าใช้งานและแนบ role/adminLevel สำหรับตรวจสอบสิทธิ์ต่อไป
// =====================================================




const jwt = require("jsonwebtoken");

exports.generateToken = (user) => {
    return jwt.sign(
        {
            id: user.admin_id || user.user_id,
            role: user.role || "admin",
            adminLevel: user.adminLevel || null,
            username: user.username || user.email,
            fullname: user.fullname,
            accountSource: user.accountSource
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );
};