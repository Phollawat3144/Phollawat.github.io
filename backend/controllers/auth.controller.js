// =====================================================
// Controller สำหรับ authentication และการจัดการบัญชี
// ประกอบด้วย login, logout, OTP reset password และข้อมูลโปรไฟล์ admin
// =====================================================




const db = require("../config/db");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");
const crypto = require("crypto");

// =====================================================
// Login flow: ตรวจสอบ identity, role และ password
// =====================================================


// =====================================================
// Login flow: ตรวจสอบ identity, role และ password
// =====================================================
exports.login = async (req, res) => {
    try {

        const {
            identity,
            password,
            role
        } = req.body;

        // ---------------------------------------------
        // ตรวจสอบข้อมูล
        // ---------------------------------------------

        if (!identity || !password || !role) {

            return res.status(400).json({
                success: false,
                message: "กรุณากรอกข้อมูลให้ครบ"
            });

        }

        if (!["admin", "member"].includes(role)) {

            return res.status(400).json({
                success: false,
                message: "Role ไม่ถูกต้อง"
            });

        }

        // =================================================
        // ADMIN LOGIN
        // =================================================

        if (role === "admin") {

            let [rows] = await db.query(
                `
                SELECT *
                FROM admins
                WHERE username = ?
                   OR email = ?
                `,
                [
                    identity,
                    identity
                ]
            );

            let admin = null;

            let source = "admins";

            // ---------------------------------------------
            // ถ้าไม่พบใน admins ให้ลอง users
            // ---------------------------------------------

            if (rows.length === 0) {

                const [userRows] = await db.query(
                    `
                    SELECT *
                    FROM users
                    WHERE email = ?
                    AND role = 'admin'
                    `,
                    [
                        identity
                    ]
                );

                if (userRows.length === 0) {

                    return res.status(401).json({
                        success: false,
                        message: "ไม่พบผู้ใช้งาน"
                    });

                }

                admin = userRows[0];

                source = "users";

            } else {

                admin = rows[0];

            }

            // =================================================
            // ตรวจสอบ PASSWORD
            // =================================================

            let match = false;

            try {

                if (
                    typeof admin.password === "string" &&
                    admin.password.startsWith("$2")
                ) {

                    match = await bcrypt.compare(
                        password,
                        admin.password
                    );

                } else {

                    // รองรับ password แบบเก่า
                    match = password === admin.password;

                    // เปลี่ยนเป็น bcrypt
                    if (match) {

                        const newHash =
                            await bcrypt.hash(
                                password,
                                10
                            );

                        if (source === "admins") {

                            await db.query(
                                `
                                UPDATE admins
                                SET password = ?
                                WHERE admin_id = ?
                                `,
                                [
                                    newHash,
                                    admin.admin_id
                                ]
                            );

                        } else {

                            await db.query(
                                `
                                UPDATE users
                                SET password = ?
                                WHERE user_id = ?
                                `,
                                [
                                    newHash,
                                    admin.user_id
                                ]
                            );

                        }

                        admin.password = newHash;

                    }

                }

            } catch (error) {

                console.error(
                    "Password verification error:",
                    error
                );

            }

            if (!match) {

                return res.status(401).json({
                    success: false,
                    message: "รหัสผ่านไม่ถูกต้อง"
                });

            }

            // =================================================
            // ADMIN NAME
            // =================================================

            const firstName =
                admin.first_name ||
                admin.firstname ||
                admin.firstName ||
                "";

            const lastName =
                admin.last_name ||
                admin.lastname ||
                admin.lastName ||
                "";

            const fullname =
                admin.fullname ||
                admin.full_name ||
                admin.name ||
                `${firstName} ${lastName}`.trim() ||
                admin.username ||
                admin.email;

            // =================================================
            // ADMIN PROFILE IMAGE
            // =================================================
            //
            // เนื่องจาก SELECT * ดึงทุก column
            // เราสามารถตรวจหาชื่อ field รูปที่มีอยู่จริงได้
            //

            const profileImage =
                admin.profile_image ||
                admin.profileImage ||
                admin.profile ||
                admin.avatar ||
                admin.photo ||
                admin.picture ||
                admin.image ||
                admin.photo_url ||
                admin.image_url ||
                admin.avatar_url ||
                admin.admin_image ||
                admin.image_path ||
                null;

            // =================================================
            // ADMIN ID
            // =================================================

            const adminId =
                admin.admin_id ||
                admin.user_id;
            const adminLevel = "super_admin";

            // =================================================
            // TOKEN
            // =================================================

            const token = generateToken({

                admin_id: adminId,

                username:
                    admin.username ||
                    admin.email,

                fullname,

                accountSource: source,

                adminLevel,

                role: "admin"

            });

            // =================================================
            // RESPONSE
            // =================================================

            return res.json({

                success: true,

                message: "Login Success",

                token,

                role: "admin",

                adminLevel,

                user: {

                    admin_id: adminId,

                    ...(source === "users" ? { user_id: admin.user_id } : {}),

                    username:
                        admin.username ||
                        admin.email ||
                        "",

                    fullname,

                    first_name: firstName,

                    last_name: lastName,

                    email:
                        admin.email ||
                        "",

                    role: "admin",

                    adminLevel,

                    accountSource: source,

                    profile_image: profileImage

                }

            });

        }

        // =================================================
        // MEMBER LOGIN
        // =================================================

        const [rows] = await db.query(
            `
            SELECT *
            FROM users
            WHERE email = ?
            AND (
                role = 'member'
                OR role IS NULL
            )
            `,
            [
                identity
            ]
        );

        if (rows.length === 0) {

            return res.status(401).json({

                success: false,

                message:
                    "ไม่พบสมาชิกหรือบทบาทไม่ตรงกับการเข้าใช้งาน"

            });

        }

        const member = rows[0];

        // ---------------------------------------------
        // ตรวจสอบ password
        // ---------------------------------------------

        const match =
            await bcrypt.compare(
                password,
                member.password
            );

        if (!match) {

            return res.status(401).json({

                success: false,

                message:
                    "รหัสผ่านไม่ถูกต้อง"

            });

        }

        // ---------------------------------------------
        // Member name
        // ---------------------------------------------

        const memberFullname =
            `${member.first_name || ""} ${member.last_name || ""}`.trim();

        // ---------------------------------------------
        // Token
        // ---------------------------------------------

        const token = generateToken({

            user_id:
                member.user_id,

            fullname:
                memberFullname,

            accountSource: "users",

            role:
                member.role || "member"

        });

        // ---------------------------------------------
        // Response
        // ---------------------------------------------

        return res.json({

            success: true,

            message: "Login Success",

            token,

            role:
                member.role || "member",

            user: {

                user_id:
                    member.user_id,

                fullname:
                    memberFullname,

                first_name:
                    member.first_name || "",

                last_name:
                    member.last_name || "",

                email:
                    member.email || "",

                role:
                    member.role || "member",

                profile_image:
                    member.profile_image ||
                    member.profileImage ||
                    member.avatar ||
                    member.photo ||
                    member.image ||
                    member.photo_url ||
                    null

            }

        });

    } catch (err) {

        console.error(
            "LOGIN ERROR:",
            err
        );

        return res.status(500).json({

            success: false,

            error:
                err.message

        });

    }

};


// =====================================================
// Logout flow: เป็น stateless และคืนสถานะสำเร็จ
// =====================================================


// =====================================================
// Logout flow: เป็น stateless และคืนสถานะสำเร็จ
// =====================================================
exports.logout = async (req, res) => {

    try {

        return res.json({

            success: true,

            message:
                "Logout successful"

        });

    } catch (err) {

        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }

};


// =====================================================
// Forgot password flow: สร้าง OTP และส่งทางอีเมล
// =====================================================


// =====================================================
// Forgot password flow: สร้าง OTP และส่งทางอีเมล
// =====================================================
exports.forgotPassword = async (req, res) => {

    try {

        const {
            email: submittedEmail,
            role
        } = req.body;
        const email = String(submittedEmail || "").trim();

        if (!email) {

            return res.status(400).json({

                success: false,

                message:
                    "กรุณาระบุอีเมล"

            });

        }

        if (!["admin", "member"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "กรุณาเลือกประเภทบัญชี"
            });
        }

        let resetAccount = null;

        if (role === "admin") {
            const [admins] = await db.query(
                `
                SELECT admin_id AS account_id
                FROM admins
                WHERE email = ?
                LIMIT 1
                `,
                [email]
            );

            if (admins.length > 0) {
                resetAccount = {
                    type: "admins",
                    id: admins[0].account_id
                };
            } else {
                const [adminUsers] = await db.query(
                    `
                    SELECT user_id AS account_id
                    FROM users
                    WHERE email = ?
                    AND role = 'admin'
                    LIMIT 1
                    `,
                    [email]
                );

                if (adminUsers.length > 0) {
                    resetAccount = {
                        type: "users",
                        id: adminUsers[0].account_id
                    };
                }
            }
        } else {
            const [members] = await db.query(
                `
                SELECT user_id AS account_id
                FROM users
                WHERE email = ?
                AND (role = 'member' OR role IS NULL)
                LIMIT 1
                `,
                [email]
            );

            if (members.length > 0) {
                resetAccount = {
                    type: "users",
                    id: members[0].account_id
                };
            }
        }

        if (!resetAccount) {
            return res.status(404).json({
                success: false,
                message: `ไม่พบบัญชี${role === "admin" ? "ผู้ดูแลระบบ" : "สมาชิก"}ที่ใช้อีเมลนี้`
            });

        }

        // ---------------------------------------------
        // Create password reset table
        // ---------------------------------------------

        await db.query(`
            CREATE TABLE IF NOT EXISTS password_resets (

                id INT AUTO_INCREMENT PRIMARY KEY,

                email VARCHAR(255) NOT NULL,

                otp VARCHAR(64) NOT NULL,

                account_type VARCHAR(20) NOT NULL DEFAULT 'users',

                account_id INT NULL,

                expires_at DATETIME NOT NULL,

                created_at
                    TIMESTAMP
                    DEFAULT CURRENT_TIMESTAMP

            )
            ENGINE=InnoDB
            DEFAULT CHARSET=utf8mb4
        `);

        // ---------------------------------------------
        // Generate OTP
        // ---------------------------------------------

        const otp = crypto.randomInt(100000, 1000000).toString();

        const expiresAt =
            new Date(
                Date.now() +
                15 * 60 * 1000
            );

        const [insertResult] = await db.query(
            `
            INSERT INTO password_resets
            (
                email,
                otp,
                account_type,
                account_id,
                expires_at
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                email,
                otp,
                resetAccount.type,
                resetAccount.id,
                expiresAt
            ]
        );
        const resetId = insertResult.insertId;

        console.info(`[password-reset] OTP for ${email}: ${otp}`);

        return res.json({

            success: true,

            resetId,

            message:
                `สร้างรหัส OTP สำหรับ${role === "admin" ? "ผู้ดูแลระบบ" : "สมาชิก"}แล้ว กรุณาตรวจสอบ backend console`

        });

    } catch (err) {

        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }

};


exports.verifyResetOtp = async (req, res) => {
    try {
        const {
            email: submittedEmail,
            resetId,
            otp: submittedOtp
        } = req.body;
        const email = String(submittedEmail || "").trim();
        const otp = String(submittedOtp || "").trim();

        if (!email || !Number.isInteger(Number(resetId)) || Number(resetId) <= 0 || !otp) {
            return res.status(400).json({
                success: false,
                message: "กรุณากรอกอีเมลและรหัส OTP ให้ครบถ้วน"
            });
        }

        const [rows] = await db.query(
            `
            SELECT expires_at
            FROM password_resets
            WHERE id = ?
            AND email = ?
            AND otp = ?
            LIMIT 1
            `,
            [Number(resetId), email, otp]
        );

        if (rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "รหัส OTP ไม่ถูกต้อง"
            });
        }

        if (new Date() > new Date(rows[0].expires_at)) {
            return res.status(400).json({
                success: false,
                message: "รหัส OTP หมดอายุ"
            });
        }

        return res.json({
            success: true,
            message: "ยืนยันรหัส OTP เรียบร้อย"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


// =====================================================
// Reset password flow: validate OTP และตั้งรหัสผ่านใหม่
// =====================================================


// =====================================================
// Reset password flow: validate OTP และตั้งรหัสผ่านใหม่
// =====================================================
exports.resetPassword = async (req, res) => {

    try {

        const {
            email: submittedEmail,
            resetId,
            otp,
            newPassword
        } = req.body;
        const email = String(submittedEmail || "").trim();
        const normalizedOtp = String(otp || "").trim();

        if (
            !email ||
            !Number.isInteger(Number(resetId)) ||
            Number(resetId) <= 0 ||
            !normalizedOtp ||
            typeof newPassword !== "string" ||
            !newPassword
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "ข้อมูลไม่ครบถ้วน"

            });

        }

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const [rows] = await conn.query(
                `
                SELECT id, account_type, account_id, expires_at
                FROM password_resets
                WHERE id = ?
                AND email = ?
                AND otp = ?
                ORDER BY created_at DESC
                LIMIT 1
                FOR UPDATE
                `,
                [Number(resetId), email, normalizedOtp]
            );

            if (rows.length === 0) {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    message: "รหัส OTP ไม่ถูกต้อง"
                });
            }

            const resetData = rows[0];
            if (new Date() > new Date(resetData.expires_at)) {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    message: "รหัส OTP หมดอายุ"
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(newPassword, salt);
            let updateResult;
            if (resetData.account_type === "admins" && resetData.account_id) {
                [updateResult] = await conn.query(
                    `
                    UPDATE admins
                    SET password = ?
                    WHERE admin_id = ? AND email = ?
                    `,
                    [hash, resetData.account_id, email]
                );
            } else if (resetData.account_type === "users" && resetData.account_id) {
                [updateResult] = await conn.query(
                    `
                    UPDATE users
                    SET password = ?
                    WHERE user_id = ? AND email = ?
                    `,
                    [hash, resetData.account_id, email]
                );
            } else {
                await conn.rollback();
                return res.status(400).json({
                    success: false,
                    message: "รหัส OTP นี้ไม่ถูกต้อง กรุณาขอรหัสใหม่"
                });
            }

            if (updateResult.affectedRows === 0) {
                await conn.rollback();
                return res.status(404).json({
                    success: false,
                    message: "ไม่พบบัญชีที่ลงทะเบียนด้วยอีเมลนี้"
                });
            }

            await conn.query(
                "DELETE FROM password_resets WHERE id = ?",
                [resetData.id]
            );
            await conn.commit();
        } catch (transactionError) {
            await conn.rollback();
            throw transactionError;
        } finally {
            conn.release();
        }

        return res.json({

            success: true,

            message:
                "เปลี่ยนรหัสผ่านเรียบร้อย"

        });

    } catch (err) {

        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }

};


// =====================================================
// Helper: ดึง profile ของ admin จาก admins หรือ users
// =====================================================
const getAdminProfileRecord = async (user) => {
    const { id, username, accountSource } = user;
    const isMatchingIdentity = username || "";

    if (accountSource !== "users") {
        const [admins] = await db.query(
            `
            SELECT admin_id, username, fullname, email, phone, profile_image, created_at
            FROM admins
            WHERE admin_id = ?
            LIMIT 1
            `,
            [id]
        );

        if (admins.length > 0) {
            const admin = admins[0];
            const [firstName = "", ...lastName] = String(admin.fullname || "").trim().split(/\s+/);

            return {
                source: "admins",
                id: admin.admin_id,
                profile: {
                    admin_id: admin.admin_id,
                    fullname: admin.fullname || "",
                    first_name: firstName,
                    last_name: lastName.join(" "),
                    email: admin.email || "",
                    phone: admin.phone || "",
                    role: "admin",
                    avatar: admin.profile_image || null,
                    profile_image: admin.profile_image || null,
                    created_at: admin.created_at
                }
            };
        }
    }

    if (accountSource !== "admins") {
        const [users] = await db.query(
            `
            SELECT user_id, first_name, last_name, email, phone, role, avatar, created_at
            FROM users
            WHERE user_id = ?
            AND role = 'admin'
            LIMIT 1
            `,
            [id]
        );

        if (users.length > 0) {
            const admin = users[0];

            return {
                source: "users",
                id: admin.user_id,
                profile: {
                    ...admin,
                    fullname: `${admin.first_name || ""} ${admin.last_name || ""}`.trim(),
                    avatar: admin.avatar || null,
                    profile_image: admin.avatar || null
                }
            };
        }
    }

    return null;
};


// =====================================================
// Profile read: คืนข้อมูล admin ที่เข้าสู่ระบบ
// =====================================================
exports.getAdminProfile = async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
    }

    try {
        const record = await getAdminProfileRecord(req.user);
        if (!record) {
            return res.status(404).json({ success: false, message: "ไม่พบข้อมูลผู้ดูแลระบบ" });
        }

        return res.json({ success: true, data: record.profile });
    } catch (err) {
        console.error("Get Admin Profile Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};


// =====================================================
// Profile update: validate email และอัปเดตโปรไฟล์
// =====================================================
exports.updateAdminProfile = async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "ไม่มีสิทธิ์แก้ไขข้อมูลนี้" });
    }

    try {
        const record = await getAdminProfileRecord(req.user);
        if (!record) {
            return res.status(404).json({ success: false, message: "ไม่พบข้อมูลผู้ดูแลระบบ" });
        }

        const firstName = String(req.body.first_name || "").trim();
        const lastName = String(req.body.last_name || "").trim();
        const email = String(req.body.email || record.profile.email || "").trim();
        const phone = String(req.body.phone || "").trim() || null;
        const avatar = req.body.avatar === undefined
            ? record.profile.avatar
            : req.body.avatar;

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: "กรุณากรอกอีเมลให้ถูกต้อง" });
        }

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const [adminEmailMatches] = await conn.query(
                "SELECT admin_id FROM admins WHERE email = ? AND admin_id <> ? LIMIT 1",
                [email, record.source === "admins" ? record.id : 0]
            );
            const [userEmailMatches] = await conn.query(
                "SELECT user_id, role FROM users WHERE email = ? AND user_id <> ? LIMIT 1",
                [email, record.source === "users" ? record.id : 0]
            );
            const isCurrentMirroredAdminEmail =
                record.source === "admins" &&
                email.toLowerCase() === String(record.profile.email || "").toLowerCase() &&
                userEmailMatches.length > 0 &&
                userEmailMatches[0].role === "admin";

            if (adminEmailMatches.length > 0 || (userEmailMatches.length > 0 && !isCurrentMirroredAdminEmail)) {
                await conn.rollback();
                return res.status(409).json({ success: false, message: "อีเมลนี้ถูกใช้งานแล้ว" });
            }

            if (record.source === "admins") {
                await conn.query(
                    `
                    UPDATE admins
                    SET fullname = ?, email = ?, phone = ?, profile_image = ?
                    WHERE admin_id = ?
                    `,
                    [`${firstName} ${lastName}`.trim(), email, phone, avatar, record.id]
                );

                await conn.query(
                    `
                    UPDATE users
                    SET first_name = ?, last_name = ?, email = ?, phone = ?, avatar = ?
                    WHERE email = ? AND role = 'admin'
                    `,
                    [firstName, lastName, email, phone, avatar, record.profile.email]
                );
            } else {
                await conn.query(
                    `
                    UPDATE users
                    SET first_name = ?, last_name = ?, email = ?, phone = ?, avatar = ?
                    WHERE user_id = ? AND role = 'admin'
                    `,
                    [firstName, lastName, email, phone, avatar, record.id]
                );
            }

            await conn.commit();
        } catch (transactionError) {
            await conn.rollback();
            throw transactionError;
        } finally {
            conn.release();
        }

        const updatedRecord = await getAdminProfileRecord(req.user);
        return res.json({ success: true, data: updatedRecord.profile });
    } catch (err) {
        console.error("Update Admin Profile Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};