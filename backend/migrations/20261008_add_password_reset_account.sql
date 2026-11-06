-- =====================================================
-- Migration: สร้างตาราง password_resets และฟิลด์ metadata สำหรับบัญชี
-- ใช้สำหรับเก็บ OTP และข้อมูลบัญชีที่ร้องขอ reset password
-- =====================================================

CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4;

ALTER TABLE password_resets
ADD COLUMN account_type VARCHAR(20) NOT NULL DEFAULT 'users',
ADD COLUMN account_id INT NULL;
