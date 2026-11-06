// =====================================================
// Utility สำหรับส่งอีเมล OTP และแจ้งเตือน
// จัดการ nodemailer transport ที่ใช้ร่วมกันทุกกระบวนการ reset password
// =====================================================




const nodemailer = require("nodemailer");

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const emailFrom = process.env.EMAIL_FROM || smtpUser || "no-reply@photoclub.local";

let transporter = null;

if (smtpHost && Number.isInteger(smtpPort) && smtpPort > 0 && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass
        }
    });
};

exports.sendMail = async ({ to, subject, text, html }) => {
    if (!transporter) {
        const missingSettings = [
            !smtpUser && "SMTP_USER",
            !smtpPass && "SMTP_PASS"
        ].filter(Boolean);
        const error = new Error(`SMTP is not configured. Missing: ${missingSettings.join(", ")}`);
        error.code = "SMTP_NOT_CONFIGURED";
        error.missingSettings = missingSettings;
        throw error;
    }

    return transporter.sendMail({
        from: emailFrom,
        to,
        subject,
        text,
        html
    });
};