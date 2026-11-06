// =====================================================
// Route สำหรับจัดการข้อมูลสมาชิก
// รวมการอ่าน/สร้าง/แก้ไข/ลบสมาชิก และ avatar upload
// =====================================================




const express = require("express");

const router = express.Router();

const upload = require("../middlewares/upload");
const memberController = require("../controllers/member.controller");
const auth = require("../middlewares/auth");
const {
    requireMemberOrSuperAdmin,
    requireSuperAdmin
} = require("../middlewares/adminPermissions");

// ==============================
// Members
// ==============================

// แสดงสมาชิกทั้งหมด
router.get(
    "/",
    auth,
    requireSuperAdmin,
    memberController.getMembers
);

// แสดงสมาชิกตาม ID
router.get(
    "/:id",
    auth,
    requireMemberOrSuperAdmin,
    memberController.getMemberById
);

// เพิ่มสมาชิก
router.post(
    "/",
    auth,
    requireSuperAdmin,
    memberController.createMember
);

// อัปโหลดรูปโปรไฟล์สมาชิก
router.post(
    "/avatar",
    auth,
    upload.single("avatar"),
    memberController.uploadAvatar
);

// เปลี่ยนสิทธิ์ผู้ใช้งาน
router.put(
    "/role/:id",
    auth,
    requireSuperAdmin,
    memberController.changeRole
);

// แก้ไขสมาชิก
router.put(
    "/:id",
    auth,
    requireMemberOrSuperAdmin,
    memberController.updateMember
);

// ลบสมาชิก
router.delete(
    "/:id",
    auth,
    requireSuperAdmin,
    memberController.deleteMember
);

module.exports = router;