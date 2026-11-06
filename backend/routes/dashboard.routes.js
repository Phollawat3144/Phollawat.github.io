// =====================================================
// Route สำหรับ dashboard admin
// เปิด endpoint สรุปข้อมูลแบบจำกัดสิทธิ์ต่อ super admin
// =====================================================




const express = require("express");

const router = express.Router();

const dashboardController = require("../controllers/dashboard.controller");
const auth = require("../middlewares/auth");
const { requireSuperAdmin } = require("../middlewares/adminPermissions");

router.get("/", auth, requireSuperAdmin, dashboardController.getDashboard);

module.exports = router;