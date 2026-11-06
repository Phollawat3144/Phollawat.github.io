// =====================================================
// KU CSC Photo Club Backend API
// จัดการ Express app, middleware, static upload path,
// การลงทะเบียน route และการตอบกลับข้อผิดพลาดทั่วไป
// =====================================================




const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
require("dotenv").config();

const db = require("./config/db");


// ==============================
// Middleware และการตั้งค่าเริ่มต้น
// ==============================
const app = express();

// ==============================
// Middleware
// ==============================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// ==============================
// Static Folder
// ==============================

app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// ==============================
// Routes
// ==============================


// ==============================
// การลงทะเบียน route หลัก
// ==============================
const authRoutes = require("./routes/auth.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const activityRoutes = require("./routes/activity.routes");
const memberRoutes = require("./routes/member.routes");
const uploadRoutes = require("./routes/upload.routes");
const locationRoutes = require("./routes/location.routes");
const galleryRoutes = require("./routes/gallery.routes");
const memberDashboardRoutes = require("./routes/memberDashboard.routes");
const memberGalleryRoutes = require("./routes/memberGallery.routes");

// Member Upload
const memberUploadRoutes = require("./routes/memberUpload.routes");

// ==============================
// Home
// ==============================


// ==============================
// Health check และ endpoint ทดสอบฐานข้อมูล
// ==============================
app.get("/", (req, res) => {

    res.json({

        success: true,

        message: "KU CSC PHOTO API Running"

    });

});

// ==============================
// Test Database
// ==============================

app.get("/api/test-db", async (req, res) => {

    try {

        const [rows] = await db.query(

            "SELECT NOW() AS server_time"

        );

        res.json({

            success: true,

            message: "Connected MySQL Successfully",

            data: rows

        });

    }

    catch (err) {

        res.status(500).json({

            success: false,

            error: err.message

        });

    }

});

// ==============================
// API Routes
// ==============================


// ==============================
// กลุ่ม API routes
// ==============================
app.use("/api/auth", authRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/activities", activityRoutes);

app.use("/api/members", memberRoutes);

app.use("/api/upload", uploadRoutes);

app.use("/api/locations", locationRoutes);

app.use("/api/gallery", galleryRoutes);
app.use("/api/member/dashboard", memberDashboardRoutes);
app.use("/api/member/gallery", memberGalleryRoutes);


// Member Upload
app.use("/api/member/upload", memberUploadRoutes);

// ==============================
// Error handler for upload issues
// ==============================


// ==============================
// Error handler จัดการ upload / validation
// ==============================
app.use((err, req, res, next) => {

    if (err instanceof multer.MulterError) {

        let message = "เกิดข้อผิดพลาดในการอัปโหลดไฟล์";

        if (err.code === "LIMIT_FILE_SIZE") {
            message = "ขนาดไฟล์เกิน 50 MB กรุณาเลือกรูปที่เล็กกว่า";
        }
        else if (err.code === "LIMIT_FILE_COUNT") {
            message = "อัปโหลดได้มากเกินจำนวนที่กำหนด";
        }
        else if (err.code === "LIMIT_UNEXPECTED_FILE") {
            message = "รูปแบบฟิลด์ไฟล์ไม่ถูกต้อง";
        }

        return res.status(400).json({
            success: false,
            message
        });
    }

    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message || "เกิดข้อผิดพลาดในการอัปโหลดไฟล์"
        });
    }

    next();

});

// ==============================
// 404
// ==============================


// ==============================
// 404 handler
// ==============================
app.use((req, res) => {

    res.status(404).json({

        success: false,

        message: "API Not Found"

    });

});

// ==============================
// Start Server
// ==============================


// ==============================
// เริ่มเซิร์ฟเวอร์
// ==============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(`Server Running : http://localhost:${PORT}`);

});