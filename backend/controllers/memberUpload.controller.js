// =====================================================
// Controller สำหรับการอัปโหลดภาพของสมาชิก
// ตรวจสอบข้อมูลกิจกรรม/รูปภาพก่อนบันทึกลงฐานข้อมูลแบบ transaction
// =====================================================




const db = require("../config/db");
const readImageMetadata = require("../utils/imageMetadata");

// ==========================================
// Create Member Upload
// ==========================================


// ==========================================
// Transaction flow: validate, create member_upload record และ insert image rows
// ==========================================
exports.createUpload = async (req, res) => {

    const conn = await db.getConnection();

    try {

        await conn.beginTransaction();

        // ==========================================
        // รับข้อมูล
        // ==========================================

        const {

            user_id: submittedUserId,

            activity_id,

            description,

            latitude,

            longitude,

            upload_date,

            upload_time

        } = req.body;

        const user_id = req.user?.id || submittedUserId;


        // ==========================================
        // Validate
        // ==========================================

        if (!user_id) {

            await conn.rollback();

            return res.status(400).json({

                success: false,

                message: "ไม่พบข้อมูลสมาชิก"

            });

        }


        if (!activity_id) {

            await conn.rollback();

            return res.status(400).json({

                success: false,

                message: "กรุณาเลือกกิจกรรม"

            });

        }


        if (!upload_date) {

            await conn.rollback();

            return res.status(400).json({

                success: false,

                message: "ไม่พบวันที่กิจกรรม"

            });

        }


        if (!upload_time) {

            await conn.rollback();

            return res.status(400).json({

                success: false,

                message: "ไม่พบเวลากิจกรรม"

            });

        }


        if (!req.files || req.files.length === 0) {

            await conn.rollback();

            return res.status(400).json({

                success: false,

                message: "กรุณาเลือกรูปภาพอย่างน้อย 1 รูป"

            });

        }


        // ==========================================
        // ตรวจสอบ Activity
        // ==========================================

        const [activities] = await conn.query(

            `
            SELECT
                activity_id,
                activity_name,
                activity_date,
                start_time,
                end_time,
                description,
                location_id,
                latitude,
                longitude
            FROM activities
            WHERE activity_id = ?
            LIMIT 1
            `,

            [activity_id]

        );


        if (activities.length === 0) {

            await conn.rollback();

            return res.status(404).json({

                success: false,

                message: "ไม่พบกิจกรรมที่เลือก"

            });

        }


        const activity = activities[0];


        // ==========================================
        // บันทึกข้อมูล Upload
        // ==========================================

        const [result] = await conn.query(

            `
            INSERT INTO member_uploads
            (
                user_id,
                activity_id,
                description,
                latitude,
                longitude,
                upload_date,
                upload_time
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,

            [

                user_id,

                activity_id,

                description || activity.description || "",

                latitude !== undefined &&
                latitude !== ""
                    ? latitude
                    : activity.latitude,

                longitude !== undefined &&
                longitude !== ""
                    ? longitude
                    : activity.longitude,

                upload_date,

                upload_time

            ]

        );


        const uploadId = result.insertId;
        const filesWithMetadata = await Promise.all(
            req.files.map(async (file) => ({
                file,
                metadata: await readImageMetadata(file.path)
            }))
        );


        // ==========================================
        // บันทึกรูปภาพลงตารางกลางเดียวกับแอดมิน
        // ==========================================

        for (const { file, metadata } of filesWithMetadata) {

            const imagePath = "/uploads/member/" + file.filename;

            await conn.query(

                `
                INSERT INTO activity_images
                (
                    activity_id,
                    image_path,
                    latitude,
                    longitude,
                    captured_at
                )
                VALUES (?, ?, ?, ?, ?)
                `,

                [

                    activity_id,

                    imagePath,

                    metadata.latitude,

                    metadata.longitude,

                    metadata.captured_at

                ]

            );

            await conn.query(

                `
                INSERT INTO member_upload_images
                (
                    upload_id,
                    image_path
                )
                VALUES (?, ?)
                `,

                [

                    uploadId,

                    imagePath

                ]

            );

        }


        // ==========================================
        // Commit
        // ==========================================

        await conn.commit();


        // ==========================================
        // Response
        // ==========================================

        res.status(201).json({

            success: true,

            message: "อัปโหลดกิจกรรมสำเร็จ",

            data: {

                upload_id: uploadId,

                activity_id: activity_id,

                activity_name: activity.activity_name,

                image_count: req.files.length

            }

        });

    }

    catch (err) {

        await conn.rollback();

        console.error(

            "Member upload error:",

            err

        );

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

    finally {

        conn.release();

    }

};