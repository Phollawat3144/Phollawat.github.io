// =====================================================
// Route สำหรับอัปโหลดภาพกิจกรรมแบบสั้น
// ใช้สำหรับส่งไฟล์ภาพไปยัง uploads/activities และคืน metadata ของไฟล์
// =====================================================




const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload");
const auth = require("../middlewares/auth");
const { requireSuperAdmin } = require("../middlewares/adminPermissions");
const readImageMetadata = require("../utils/imageMetadata");

// อัปโหลดหลายรูป
router.post("/", auth, requireSuperAdmin, upload.array("images", 100), async (req, res, next) => {

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            success: false,
            message: "ไม่พบไฟล์ที่อัปโหลด"
        });
    }

    try {
        const files = [];
        for (const file of req.files) {
            const metadata = file.mimetype === "image/jpeg"
                ? await readImageMetadata(file.path)
                : { latitude: null, longitude: null, captured_at: null };

            files.push({
                filename: file.filename,
                path: "/uploads/activities/" + file.filename,
                ...metadata
            });
        }

        res.json({
            success: true,
            files
        });
    } catch (error) {
        next(error);
    }

});

module.exports = router;