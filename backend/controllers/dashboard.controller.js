// =====================================================
// Controller สำหรับ dashboard admin
// นับจำนวนกิจกรรม สมาชิก ข่าวสาร และภาพถ่าย เพื่อแสดงสรุปข้อมูลเริ่มต้น
// =====================================================




const db = require("../config/db");

exports.getDashboard = async (req, res) => {

    try {

        const [[activities]] = await db.query(
            "SELECT COUNT(*) total FROM activities"
        );

        const [[members]] = await db.query(
            "SELECT COUNT(*) total FROM members"
        );

        const [[news]] = await db.query(
            "SELECT COUNT(*) total FROM news"
        );

        const [[gallery]] = await db.query(
            "SELECT COUNT(*) total FROM activity_images"
        );

        res.json({

            success: true,

            data: {

                activities: activities.total,

                members: members.total,

                news: news.total,

                gallery: gallery.total

            }

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            error: err.message

        });

    }

};