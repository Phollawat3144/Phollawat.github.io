// =====================================================
// Route สำหรับ authentication และจัดการบัญชี administrator
// รวม login, logout, profile และ flow reset password
// =====================================================




const express = require("express");

const router = express.Router();

const authController = require("../controllers/auth.controller");
const auth = require("../middlewares/auth");

// Login

// ==========================================
// Collection ของ auth endpoints
// ==========================================
router.post("/login", authController.login);

// Admin profile
router.get("/profile", auth, authController.getAdminProfile);
router.put("/profile", auth, authController.updateAdminProfile);

// Logout (stateless)
router.post("/logout", authController.logout);

// Forgot password (send OTP)
router.post("/forgot-password", authController.forgotPassword);

// Verify password reset OTP
router.post("/verify-reset-otp", authController.verifyResetOtp);

// Reset password
router.post("/reset-password", authController.resetPassword);

// Test Route
router.get("/login", (req, res) => {
    res.json({
        success: true,
        message: "Auth Route Working"
    });
});

module.exports = router;