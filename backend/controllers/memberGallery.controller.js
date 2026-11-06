// =====================================================
// Controller สำหรับแกลเลอรีส่วนตัวของสมาชิก
// ดึงภาพที่สมาชิกเป็นคนอัปโหลดหรือมีสิทธิ์เข้าถึงจากกิจกรรมที่เขาร่วม
// =====================================================




const db = require("../config/db");

// ==========================================
// Member Gallery
// ==========================================
exports.getMyPhotos = async (req, res) => {

    try {

        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "ไม่พบสมาชิกผู้ใช้งาน" });
        }

        const [rows] = await db.query(
            `
            SELECT
                ai.image_id,
                ai.image_path,
                ai.latitude AS image_latitude,
                ai.longitude AS image_longitude,
                ai.captured_at,
                NULL AS upload_id,
                NULL AS upload_date,
                NULL AS upload_time,
                a.description,
                a.latitude,
                a.longitude,
                a.activity_id,
                a.activity_name,
                a.activity_date,
                a.start_time,
                a.end_time,
                l.location_name,
                NULL AS first_name,
                NULL AS last_name
            FROM activity_images ai
            INNER JOIN activities a ON ai.activity_id = a.activity_id
            LEFT JOIN locations l ON a.location_id = l.location_id
            WHERE EXISTS (
                SELECT 1
                FROM member_uploads member_album
                WHERE member_album.activity_id = a.activity_id
                  AND member_album.user_id = ?
            )
            AND NOT EXISTS (
                SELECT 1
                FROM member_upload_images own_image
                INNER JOIN member_uploads own_upload
                    ON own_upload.upload_id = own_image.upload_id
                WHERE own_upload.user_id = ?
                  AND own_upload.activity_id = a.activity_id
                  AND own_image.image_path = ai.image_path
            )

            UNION ALL

            SELECT
                mui.image_id,
                mui.image_path,
                ai.latitude AS image_latitude,
                ai.longitude AS image_longitude,
                ai.captured_at,
                mu.upload_id,
                mu.upload_date,
                mu.upload_time,
                mu.description,
                mu.latitude,
                mu.longitude,
                a.activity_id,
                a.activity_name,
                a.activity_date,
                a.start_time,
                a.end_time,
                l.location_name,
                uploader.first_name,
                uploader.last_name
            FROM member_upload_images mui
            INNER JOIN member_uploads mu ON mui.upload_id = mu.upload_id
            INNER JOIN activities a ON mu.activity_id = a.activity_id
            LEFT JOIN activity_images ai ON ai.image_path = mui.image_path
            LEFT JOIN locations l ON a.location_id = l.location_id
            LEFT JOIN users uploader ON mu.user_id = uploader.user_id
            WHERE mu.user_id = ?
            ORDER BY activity_date DESC, image_id DESC
            `,
            [userId, userId, userId]
        );

        const data = rows.map((item) => ({
            ...item,
            image_path: item.image_path || "",
            activity_name: item.activity_name || "ภาพส่วนตัว"
        }));

        res.json({

            success: true,

            data

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