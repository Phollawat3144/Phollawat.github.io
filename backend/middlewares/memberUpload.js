// =====================================================
// Multer configuration สำหรับอัปโหลดภาพสมาชิก
// จัดเก็บไฟล์ใน uploads/member และจำกัดประเภทไฟล์เป็น JPG/JPEG เท่านั้น
// =====================================================




const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==========================================
// Upload Folder
// ==========================================

const uploadDir = path.join(
    __dirname,
    "../uploads/member"
);


// ==========================================
// Create Folder Automatically
// ==========================================

if (!fs.existsSync(uploadDir)) {

    fs.mkdirSync(
        uploadDir,
        {
            recursive: true
        }
    );

}


// ==========================================
// Storage
// ==========================================


// ==========================================
// Storage config สำหรับ member upload
// ==========================================
const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, uploadDir);

    },

    filename: (req, file, cb) => {

        const ext =
            path.extname(file.originalname)
                .toLowerCase();

        const filename =
            Date.now() +
            "-" +
            Math.round(
                Math.random() * 1000000
            ) +
            ext;

        cb(null, filename);

    }

});


// ==========================================
// File Filter
// ==========================================


// ==========================================
// Validation: จำกัดไฟล์ให้อยู่ในรูปแบบ JPG/JPEG
// ==========================================
const fileFilter = (req, file, cb) => {

    const allowedTypes = [

        "image/jpeg",
        "image/jpg"

    ];

    if (
        allowedTypes.includes(
            file.mimetype
        )
    ) {

        cb(null, true);

    }

    else {

        cb(
            new Error(
                "รองรับเฉพาะไฟล์ JPG/JPEG เท่านั้น"
            )
        );

    }

};


// ==========================================
// Multer
// ==========================================


// ==========================================
// Export multer instance สำหรับ member upload
// ==========================================
const upload = multer({

    storage,

    fileFilter,

    limits: {

        // ขนาดสูงสุดต่อไฟล์ 50 MB
        fileSize: 50 * 1024 * 1024

    }

});


// ==========================================
// Export
// ==========================================

module.exports = upload;