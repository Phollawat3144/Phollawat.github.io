// =====================================================
// Route สำหรับ dashboard ของสมาชิก
// ใช้ auth middleware ตรวจสอบสิทธิ์ก่อนดึงสถิติส่วนตัว
// =====================================================




const express = require("express");

const router = express.Router();

const auth = require("../middlewares/auth");
const controller = require("../controllers/memberDashboard.controller");

router.get("/", auth, controller.getDashboard);

module.exports = router;