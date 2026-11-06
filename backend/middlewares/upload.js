// =====================================================
// Multer configuration สำหรับอัปโหลดภาพกิจกรรมทั่วไป
// สร้างโฟลเดอร์ upload อัตโนมัติและจัดเก็บไฟล์ตาม field name
// =====================================================




const multer = require("multer");
const path = require("path");

const fs = require("fs");

// ==========================================
// Storage config: จัดเก็บไฟล์ตาม field name และใช้ timestamp เป็นชื่อ
// ==========================================
const storage = multer.diskStorage({

    destination(req, file, cb) {

        const folder = file.fieldname === "avatar" ? "members" : "activities";
        const dir = `uploads/${folder}`;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);

    },

    filename(req, file, cb) {

        const ext = path.extname(file.originalname);

        cb(

            null,

            Date.now() + ext

        );

    }

});

module.exports = multer({

    storage

});