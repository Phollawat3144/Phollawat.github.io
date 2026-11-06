// =====================================================
// Middleware ตรวจสอบสิทธิ์ผู้ใช้งาน
// กำหนด role ย่อย เช่น super admin, content admin, member และ admin uploader
// =====================================================





// =========================================
// Role checks สำหรับผู้ดูแลระบบหลัก
// =========================================
exports.requireSuperAdmin = (req, res, next) => {
    if (req.user?.role !== "admin" || req.user.adminLevel !== "super_admin") {
        return res.status(403).json({
            success: false,
            message: "ฟังก์ชันนี้สำหรับผู้ดูแลระบบหลักเท่านั้น"
        });
    }

    next();
};


// =========================================
// Role checks สำหรับ content uploader
// =========================================
exports.requireContentUploader = (req, res, next) => {
    const isMember = req.user?.role === "member";
    const isContentAdmin =
        req.user?.role === "admin" &&
        req.user.adminLevel === "content_admin";

    if (!isMember && !isContentAdmin) {
        return res.status(403).json({
            success: false,
            message: "ไม่มีสิทธิ์อัปโหลดภาพกิจกรรม"
        });
    }

    next();
};


// =========================================
// Role checks สำหรับ admin uploader ของอัลบั้มภาพ
// =========================================
exports.requireAdminImageUploader = (req, res, next) => {
    const isAdmin =
        req.user?.role === "admin" &&
        ["super_admin", "content_admin"].includes(req.user.adminLevel);

    if (!isAdmin) {
        return res.status(403).json({
            success: false,
            message: "ไม่มีสิทธิ์อัปโหลดภาพในอัลบั้มกิจกรรม"
        });
    }

    next();
};


// =========================================
// Role checks สำหรับการดู/แก้ไขสมาชิกด้วยสิทธิ์จำกัด
// =========================================
exports.requireMemberOrSuperAdmin = (req, res, next) => {
    const isSelf =
        ["member", "admin"].includes(req.user?.role) &&
        Number(req.user?.id) === Number(req.params.id);
    const isSuperAdmin =
        req.user?.role === "admin" &&
        req.user.adminLevel === "super_admin";

    if (!isSelf && !isSuperAdmin) {
        return res.status(403).json({
            success: false,
            message: "ไม่มีสิทธิ์เข้าถึงข้อมูลสมาชิกนี้"
        });
    }

    next();
};