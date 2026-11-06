// =====================================================
// Controller สำหรับ dashboard ของสมาชิก
// รวมสถิติภาพถ่าย/กิจกรรม/การอัปโหลดและข้อมูล upload ล่าสุดของผู้ใช้แต่ละคน
// =====================================================




const db = require("../config/db");

// =======================================
// Member Dashboard
// =======================================

exports.getDashboard = async (req, res) => {

    try {

        const user_id = req.user?.id;

        if (!user_id) {

            return res.status(401).json({

                success: false,

                message: "Unauthorized"

            });

        }

        // =============================
        // จำนวนรูปทั้งหมด
        // =============================

        const [photoRows] = await db.query(

            `
            SELECT COUNT(*) AS total
            FROM member_upload_images mui
            INNER JOIN member_uploads mu
            ON mui.upload_id = mu.upload_id
            WHERE mu.user_id = ?
            `,

            [user_id]

        );

        // =============================
        // จำนวนกิจกรรม
        // =============================

        const [activityRows] = await db.query(

            `
            SELECT COUNT(DISTINCT activity_id) AS total
            FROM member_uploads
            WHERE user_id=?
            `,

            [user_id]

        );

        // =============================
        // จำนวน Upload
        // =============================

        const [uploadRows] = await db.query(

            `
            SELECT COUNT(*) AS total
            FROM member_uploads
            WHERE user_id=?
            `,

            [user_id]

        );

        // =============================
        // Downloads (ไว้ทำทีหลัง)
        // =============================

        const downloads = 0;

        // =============================
        // Recent Upload
        // =============================

        const [recentUploads] = await db.query(

            `
            SELECT

                mu.upload_id,

                mu.activity_id,

                a.activity_name,

                mu.upload_date,

                mu.upload_time,

                mu.description

            FROM member_uploads mu

            LEFT JOIN activities a

            ON mu.activity_id = a.activity_id

            WHERE mu.user_id=?

            ORDER BY mu.upload_id DESC

            LIMIT 5
            `,

            [user_id]

        );

        // =============================
        // Latest Photos
        // =============================

        const [latestPhotos] = await db.query(

            `
            SELECT

                mui.image_id,

                mui.image_path

            FROM member_upload_images mui

            INNER JOIN member_uploads mu

            ON mui.upload_id = mu.upload_id

            WHERE mu.user_id=?

            ORDER BY mui.image_id DESC

            LIMIT 8
            `,

            [user_id]

        );

        const [monthlyRows] = await db.query(

            `
            SELECT MONTH(mu.upload_date) AS month_num,

                   COUNT(*) AS total

            FROM member_uploads mu

            WHERE mu.user_id=?

              AND mu.upload_date >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)

            GROUP BY MONTH(mu.upload_date)

            ORDER BY MONTH(mu.upload_date)
            `,

            [user_id]

        );

        const monthlyUploads = Array(12).fill(0);

        monthlyRows.forEach((row) => {

            const index = Number(row.month_num) - 1;

            if (index >= 0 && index < 12) {

                monthlyUploads[index] = Number(row.total);

            }

        });

        res.json({

            success: true,

            stats: {

                photos: photoRows[0].total,

                activities: activityRows[0].total,

                uploads: uploadRows[0].total,

                downloads

            },

            recentUploads,

            latestPhotos,

            monthlyUploads

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};