// =====================================================
// Route สำหรับแกลเลอรีส่วนตัวของสมาชิก
// ดึงภาพที่สมาชิกเป็นเจ้าของหรือมีสิทธิ์เข้าถึงจากกิจกรรมที่ร่วมทำงาน
// =====================================================




const express = require("express");

const router = express.Router();

const auth = require("../middlewares/auth");
const controller = require("../controllers/memberGallery.controller");

router.get("/", auth, controller.getMyPhotos);

module.exports = router;