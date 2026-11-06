// =====================================================
// Route สำหรับกิจกรรม
// เชื่อม API endpoints กับ controller และ middleware สำหรับสิทธิ์ความปลอดภัย
// =====================================================




const express = require("express");

const router = express.Router();

const activityController = require("../controllers/activity.controller");
const auth = require("../middlewares/auth");
const { requireSuperAdmin } = require("../middlewares/adminPermissions");

// ดึงทั้งหมด
router.get("/", activityController.getActivities);

// ดึง 1 รายการ
router.get("/:id", activityController.getActivityById);

// เพิ่ม
router.post("/", auth, requireSuperAdmin, activityController.createActivity);

// แก้ไข
router.put("/:id", auth, requireSuperAdmin, activityController.updateActivity);

// ลบ
router.delete("/:id", auth, requireSuperAdmin, activityController.deleteActivity);

module.exports = router;