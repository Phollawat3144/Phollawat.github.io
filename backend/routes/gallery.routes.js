// =====================================================
// Route สำหรับอัลบั้มภาพกิจกรรม
// ประกอบด้วยการอ่านข้อมูล รายละเอียด การอัปโหลด และดาวน์โหลด ZIP
// =====================================================




const express = require("express");

const router = express.Router();

const galleryController = require("../controllers/gallery.controller");
const upload = require("../middlewares/upload");
const auth = require('../middlewares/auth');
const { requireAdminImageUploader } = require("../middlewares/adminPermissions");

// แสดงอัลบั้มทั้งหมด
router.get("/", galleryController.getGallery);

// ดาวน์โหลดทั้งอัลบั้ม
router.get("/:id/download", galleryController.downloadAlbum);

// อัปโหลดรูปเข้าอัลบั้ม
// Require authentication for uploads (members or admins)
router.post("/:id/upload", auth, requireAdminImageUploader, upload.array("images", 100), galleryController.uploadGalleryImages);
router.post("/upload", auth, requireAdminImageUploader, upload.array("images", 100), galleryController.uploadGalleryImages);
// ลบรูปเดี่ยว
router.delete('/image/:id', auth, galleryController.deleteImage);

// รายละเอียดอัลบั้ม
router.get("/:id", galleryController.getGalleryDetail);

module.exports = router;