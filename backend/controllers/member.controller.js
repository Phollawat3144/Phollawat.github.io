// =====================================================
// Controller สำหรับจัดการสมาชิก
// รวม logic การอ่านสมาชิก, สร้างสมาชิก, อัปเดตข้อมูล, เปลี่ยนบทบาท และอัปโหลด avatar
// =====================================================




const db = require("../config/db");
const bcrypt = require("bcrypt");

// =========================================
// แสดงสมาชิกทั้งหมด
// =========================================

// =========================================
// Read member list สำหรับกรอง duplicate admin
// =========================================
exports.getMembers = async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                user_id,
                first_name,
                last_name,
                email,
                phone,
                role,
                avatar,
                status,
                created_at
            FROM users
            WHERE NOT (
                role = 'admin'
                AND EXISTS (
                    SELECT 1
                    FROM admins
                    WHERE admins.email = users.email
                )
            )
            ORDER BY user_id DESC
        `);

        res.json({

            success: true,

            total: rows.length,

            data: rows

        });

    } catch (err) {

        console.error("Get Members Error :", err);

        res.status(500).json({

            success: false,

            error: err.message

        });

    }

};

// =========================================
// แสดงสมาชิกตาม ID
// =========================================

// =========================================
// Read single member record ตาม id
// =========================================
exports.getMemberById = async (req, res) => {

    try {

        const { id } = req.params;

        const [rows] = await db.query(

            `
            SELECT
                user_id,
                first_name,
                last_name,
                email,
                phone,
                role,
                avatar,
                status,
                created_at
            FROM users
            WHERE user_id = ?
            LIMIT 1
            `,

            [id]

        );

        if (rows.length === 0) {

            return res.status(404).json({

                success: false,

                message: "ไม่พบสมาชิก"

            });

        }

        return res.json({

            success: true,

            data: rows[0]

        });

    } catch (err) {

        console.error("Get Member Error :", err);

        return res.status(500).json({

            success: false,

            error: err.message

        });

    }

};
// =========================================
// เพิ่มสมาชิก
// =========================================

// =========================================
// Create member: validate email/password และบันทึกข้อมูลใหม่
// =========================================
exports.createMember = async (req, res) => {

    try {

        const {

            first_name,
            last_name,
            email,
            phone,
            password,
            role,
            avatar

        } = req.body;
        const normalizedEmail = String(email || "").trim();
        const normalizedRole = role || "member";

        // ตรวจสอบข้อมูล
        if (
            !first_name ||
            !last_name ||
            !normalizedEmail ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message: "กรุณากรอกข้อมูลให้ครบ"

            });

        }

        if (!["admin", "member"].includes(normalizedRole)) {
            return res.status(400).json({
                success: false,
                message: "Role ไม่ถูกต้อง"
            });
        }

        // ตรวจสอบ Email
        const [checkEmail] = await db.query(

            `
            SELECT user_id
            FROM users
            WHERE email = ?
            `,

            [normalizedEmail]

        );

        if (checkEmail.length > 0) {

            return res.status(400).json({

                success: false,

                message: "Email นี้ถูกใช้งานแล้ว"

            });

        }

        const [checkAdminEmail] = await db.query(
            "SELECT admin_id FROM admins WHERE email = ? LIMIT 1",
            [normalizedEmail]
        );

        if (checkAdminEmail.length > 0) {
            return res.status(400).json({
                success: false,
                message: "อีเมลนี้ถูกใช้กับบัญชีผู้ดูแลระบบหลักแล้ว"
            });
        }

        // เข้ารหัส Password
        const hashPassword = await bcrypt.hash(password, 10);

        // เพิ่มข้อมูล
        const [result] = await db.query(

            `
            INSERT INTO users
            (
                first_name,
                last_name,
                email,
                phone,
                password,
                role,
                avatar
            )
            VALUES
            (
                ?, ?, ?, ?, ?, ?, ?
            )
            `,

            [

                first_name,
                last_name,
                normalizedEmail,
                phone || null,
                hashPassword,
                normalizedRole,
                avatar || null

            ]

        );

        return res.status(201).json({

            success: true,

            message: "เพิ่มสมาชิกสำเร็จ",

            user_id: result.insertId

        });

    } catch (err) {

        console.error("Create Member Error :", err);

        return res.status(500).json({

            success: false,

            error: err.message

        });

    }

};
// =========================================
// แก้ไขสมาชิก
// =========================================

// =========================================
// Update member: validate payload และจำกัดการแก้ไขตามสิทธิ์
// =========================================
exports.updateMember = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            first_name,
            last_name,
            email,
            phone,
            password,
            role,
            status,
            avatar
        } = req.body;
        const normalizedEmail = String(email || "").trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "กรุณากรอกอีเมลให้ถูกต้อง"
            });
        }

        // ตรวจสอบสมาชิก
        const [member] = await db.query(
            `
            SELECT *
            FROM users
            WHERE user_id = ?
            `,
            [id]
        );

        if (member.length === 0) {

            return res.status(404).json({

                success: false,

                message: "ไม่พบสมาชิก"

            });

        }

        const isSuperAdmin =
            req.user?.role === "admin" &&
            req.user.adminLevel === "super_admin";
        const isSelf = Number(req.user?.id) === Number(id);

        if (!isSuperAdmin && !isSelf) {
            return res.status(403).json({
                success: false,
                message: "ไม่มีสิทธิ์แก้ไขข้อมูลสมาชิกนี้"
            });
        }

        // ตรวจสอบ Email ซ้ำ
        const [checkEmail] = await db.query(
            `
            SELECT user_id
            FROM users
            WHERE email = ?
            AND user_id <> ?
            `,
            [normalizedEmail, id]
        );

        if (checkEmail.length > 0) {

            return res.status(400).json({

                success: false,

                message: "Email นี้ถูกใช้งานแล้ว"

            });

        }

        const [checkAdminEmail] = await db.query(
            `
            SELECT admin_id
            FROM admins
            WHERE email = ?
            LIMIT 1
            `,
            [normalizedEmail]
        );

        if (checkAdminEmail.length > 0) {
            return res.status(400).json({
                success: false,
                message: "อีเมลนี้ถูกใช้กับบัญชีผู้ดูแลระบบหลักแล้ว"
            });
        }

        let hashPassword = member[0].password;

        // เปลี่ยนรหัสผ่านเมื่อมีการส่งมา
        if (isSuperAdmin && password && password.trim() !== "") {

            hashPassword = await bcrypt.hash(password, 10);

        }

        await db.query(
            `
            UPDATE users
            SET
                first_name = ?,
                last_name = ?,
                email = ?,
                phone = ?,
                password = ?,
                role = ?,
                status = ?,
                avatar = ?
            WHERE user_id = ?
            `,
            [
                first_name,
                last_name,
                normalizedEmail,
                phone || null,
                hashPassword,
                isSuperAdmin ? role : member[0].role,
                isSuperAdmin ? status : member[0].status,
                avatar !== undefined ? avatar : member[0].avatar,
                id
            ]
        );

        return res.json({

            success: true,

            message: "แก้ไขสมาชิกสำเร็จ"

        });

    } catch (err) {

        console.error("Update Member Error :", err);

        return res.status(500).json({

            success: false,

            error: err.message

        });

    }

};
// =========================================
// อัปโหลดรูปโปรไฟล์สมาชิก
// =========================================
exports.uploadAvatar = async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message: "ไม่พบไฟล์ที่อัปโหลด"

            });

        }

        return res.json({

            success: true,

            path: `/uploads/members/${req.file.filename}`

        });

    } catch (err) {

        console.error("Upload Avatar Error :", err);

        return res.status(500).json({

            success: false,

            error: err.message

        });

    }

};

// =========================================
// ลบสมาชิก
// =========================================

// =========================================
// Delete member: ลบข้อมูลสมาชิกและรูป avatar ที่เกี่ยวข้อง
// =========================================
exports.deleteMember = async (req, res) => {

    try {

        const { id } = req.params;

        // ตรวจสอบสมาชิก
        const [member] = await db.query(
            `
            SELECT user_id
            FROM users
            WHERE user_id = ?
            `,
            [id]
        );

        if (member.length === 0) {

            return res.status(404).json({

                success: false,

                message: "ไม่พบสมาชิก"

            });

        }

        await db.query(
            `
            DELETE FROM users
            WHERE user_id = ?
            `,
            [id]
        );

        return res.json({

            success: true,

            message: "ลบสมาชิกสำเร็จ"

        });

    } catch (err) {

        console.error("Delete Member Error :", err);

        return res.status(500).json({

            success: false,

            error: err.message

        });

    }

};

// =========================================
// เปลี่ยนสิทธิ์ผู้ใช้งาน
// =========================================
exports.changeRole = async (req, res) => {

    try {

        const { id } = req.params;

        const { role } = req.body;

        if (!["admin", "member"].includes(role)) {

            return res.status(400).json({

                success: false,

                message: "Role ไม่ถูกต้อง"

            });

        }

        const [member] = await db.query(
            `
            SELECT user_id
            FROM users
            WHERE user_id = ?
            `,
            [id]
        );

        if (member.length === 0) {

            return res.status(404).json({

                success: false,

                message: "ไม่พบสมาชิก"

            });

        }

        await db.query(
            `
            UPDATE users
            SET role = ?
            WHERE user_id = ?
            `,
            [role, id]
        );

        return res.json({

            success: true,

            message: "เปลี่ยนสิทธิ์ผู้ใช้งานสำเร็จ"

        });

    } catch (err) {

        console.error("Change Role Error :", err);

        return res.status(500).json({

            success: false,

            error: err.message

        });

    }

};