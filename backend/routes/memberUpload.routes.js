// =====================================================
// Route สำหรับส่วนนำเข้าภาพของสมาชิก
// เปิด endpoint อัปโหลดภาพกิจกรรมที่จำกัดต่อ member/content uploader
// =====================================================




const express = require("express");

const router = express.Router();

const controller = require("../controllers/memberUpload.controller");

const upload = require("../middlewares/memberUpload");
const auth = require("../middlewares/auth");
const { requireContentUploader } = require("../middlewares/adminPermissions");

// ==========================================
// Member Upload API
// ==========================================

router.get("/", (req, res) => {

    res.json({

        success: true,

        message: "Member Upload API Working"

    });

});

// ==========================================
// Upload Activity
// ไม่จำกัดจำนวนรูป
// ==========================================

router.post(

    "/",

    auth,

    requireContentUploader,

    upload.array("images"),

    controller.createUpload

);

module.exports = router;