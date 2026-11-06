// =====================================================
// Controller สำหรับจัดการข้อมูลสถานที่จัดกิจกรรม
// ดึง เพิ่ม แก้ไข และลบข้อมูลสถานที่ที่ใช้ร่วมในแอปพลิเคชัน
// =====================================================




const db = require("../config/db");

// =======================================
// ดึงสถานที่ทั้งหมด
// =======================================

exports.getLocations = async (req, res) => {

    try {

        const [rows] = await db.query(`

            SELECT

                location_id,
                location_name,
                latitude,
                longitude

            FROM locations

            ORDER BY location_id DESC

        `);

        res.json({

            success: true,

            total: rows.length,

            data: rows

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            error: err.message

        });

    }

};

// =======================================
// ดึงสถานที่ตาม id
// =======================================

exports.getLocationById = async (req, res) => {

    try {

        const { id } = req.params;

        const [rows] = await db.query(

            `SELECT *

             FROM locations

             WHERE location_id=?`,

            [id]

        );

        if (rows.length === 0) {

            return res.status(404).json({

                success: false,

                message: "ไม่พบสถานที่"

            });

        }

        res.json({

            success: true,

            data: rows[0]

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            error: err.message

        });

    }

};

// =======================================
// เพิ่มสถานที่
// =======================================

exports.createLocation = async (req, res) => {

    try {

        const {

            location_name,

            latitude,

            longitude

        } = req.body;

        const [result] = await db.query(

            `INSERT INTO locations
            (
                location_name,
                latitude,
                longitude
            )
            VALUES (?,?,?)`,

            [

                location_name,

                latitude,

                longitude

            ]

        );

        res.status(201).json({

            success: true,

            message: "เพิ่มสถานที่สำเร็จ",

            location_id: result.insertId

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            error: err.message

        });

    }

};

// =======================================
// แก้ไขสถานที่
// =======================================

exports.updateLocation = async (req, res) => {

    try {

        const { id } = req.params;

        const {

            location_name,

            latitude,

            longitude

        } = req.body;

        await db.query(

            `UPDATE locations

            SET

                location_name=?,

                latitude=?,

                longitude=?

            WHERE location_id=?`,

            [

                location_name,

                latitude,

                longitude,

                id

            ]

        );

        res.json({

            success: true,

            message: "แก้ไขสถานที่สำเร็จ"

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            error: err.message

        });

    }

};

// =======================================
// ลบสถานที่
// =======================================

exports.deleteLocation = async (req, res) => {

    try {

        const { id } = req.params;

        await db.query(

            "DELETE FROM locations WHERE location_id=?",

            [id]

        );

        res.json({

            success: true,

            message: "ลบสถานที่สำเร็จ"

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            error: err.message

        });

    }

};