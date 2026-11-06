// =====================================================
// Controller สำหรับอัลบั้มภาพกิจกรรม
// ตรวจสอบวันที่/เวลา, ดึง metadata, อัปโหลดภาพ, ดาวน์โหลด ZIP และลบรูปภาพ
// =====================================================




const db = require("../config/db");
const readImageMetadata = require("../utils/imageMetadata");

const isValidCoordinate = (latitude, longitude) => {
    const lat = Number(latitude);
    const lng = Number(longitude);

    return latitude !== null &&
        latitude !== undefined &&
        latitude !== "" &&
        longitude !== null &&
        longitude !== undefined &&
        longitude !== "" &&
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180;
};

const getCoordinateDistanceMeters = (first, second) => {
    const latitudeDifference = (Number(second.latitude) - Number(first.latitude)) * Math.PI / 180;
    const longitudeDifference = (Number(second.longitude) - Number(first.longitude)) * Math.PI / 180;
    const haversine = Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(Number(first.latitude) * Math.PI / 180) *
        Math.cos(Number(second.latitude) * Math.PI / 180) *
        Math.sin(longitudeDifference / 2) ** 2;

    return 6371000 * 2 *
        Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");

// =========================================
// Helper
// =========================================

// =========================================
// Helper: normalize path สำหรับรูปภาพให้ frontend
// =========================================
const normalizePath = (filePath) => {
    if (!filePath) {
        return "/uploads/no-image.png";
    }

    return filePath.replace(/\\/g, "/");
};

// =========================================
// แสดงอัลบั้มทั้งหมด
// =========================================

// =========================================
// ดึงรายการอัลบั้มภาพพร้อมกรองวันที่/เวลา
// =========================================
exports.getGallery = async (req, res) => {
    const memberId = req.query.member_id;
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;
    const startTime = req.query.start_time;
    const endTime = req.query.end_time;

    try {
        const isValidDate = (value) => {
            if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                return false;
            }

            const parsed = new Date(`${value}T00:00:00.000Z`);
            return !Number.isNaN(parsed.getTime()) &&
                parsed.toISOString().slice(0, 10) === value;
        };

        if ((startDate && !isValidDate(startDate)) || (endDate && !isValidDate(endDate))) {
            return res.status(400).json({
                success: false,
                message: "รูปแบบวันที่ไม่ถูกต้อง กรุณาเลือกวันที่อีกครั้ง"
            });
        }

        if (startDate && endDate && startDate > endDate) {
            return res.status(400).json({
                success: false,
                message: "วันเริ่มต้นต้องไม่อยู่หลังวันสิ้นสุด"
            });
        }

        const isValidTime = (value) =>
            typeof value === "string" &&
            /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

        if ((startTime && !isValidTime(startTime)) || (endTime && !isValidTime(endTime))) {
            return res.status(400).json({
                success: false,
                message: "รูปแบบเวลาไม่ถูกต้อง กรุณาเลือกเวลาอีกครั้ง"
            });
        }

        if (startTime && endTime && startTime > endTime) {
            return res.status(400).json({
                success: false,
                message: "เวลาเริ่มต้นต้องไม่อยู่หลังเวลาสิ้นสุด"
            });
        }

        let query = `
            SELECT
                a.activity_id,
                a.activity_name,
                a.activity_date,
                a.description,
                a.start_time,
                a.end_time,
                a.latitude,
                a.longitude,
                a.member_id,
                a.admin_id,
                COALESCE(
                    (
                        SELECT GROUP_CONCAT(
                            selected_location.location_name
                            ORDER BY activity_location.sort_order
                            SEPARATOR ', '
                        )
                        FROM activity_locations activity_location
                        INNER JOIN locations selected_location
                            ON selected_location.location_id = activity_location.location_id
                        WHERE activity_location.activity_id = a.activity_id
                    ),
                    l.location_name
                ) AS location_name,

                MIN(ai.image_path) AS cover_image,

                COUNT(ai.image_id) AS total_images

            FROM activities a

            LEFT JOIN locations l
                ON l.location_id = a.location_id

            LEFT JOIN activity_images ai
                ON ai.activity_id = a.activity_id
        `;

        const params = [];
        const conditions = [];

        if (memberId) {
            conditions.push("(a.member_id = ? OR a.member_id IS NULL)");
            params.push(memberId);
        }

        if (startDate) {
            conditions.push("a.activity_date >= ?");
            params.push(startDate);
        }

        if (endDate) {
            conditions.push("a.activity_date <= ?");
            params.push(endDate);
        }

        if (startTime) {
            conditions.push("a.end_time >= ?");
            params.push(startTime);
        }

        if (endTime) {
            conditions.push("a.start_time <= ?");
            params.push(endTime);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(" AND ")} `;
        }

        query += `
            GROUP BY
                a.activity_id,
                a.activity_name,
                a.activity_date,
                a.description,
                a.start_time,
                a.end_time,
                a.latitude,
                a.longitude,
                a.member_id,
                a.admin_id,
                l.location_name

            ORDER BY
                a.activity_date DESC,
                a.activity_name ASC
        `;

        const [rows] = await db.query(query, params);

        const gallery = rows.map(item => ({

            activity_id: item.activity_id,

            activity_name: item.activity_name,

            activity_date: item.activity_date,

            description: item.description,

            start_time: item.start_time,

            end_time: item.end_time,

            latitude: item.latitude,

            longitude: item.longitude,

            location_name: item.location_name,

            member_id: item.member_id,

            admin_id: item.admin_id,

            cover_image: normalizePath(item.cover_image),

            total_images: Number(item.total_images)

        }));

        return res.json({

            success: true,

            total: gallery.length,

            data: gallery

        });

    } catch (err) {

        console.error("Gallery Error :", err);

        return res.status(500).json({

            success: false,

            error: err.message

        });

    }

};

// =========================================
// รายละเอียดอัลบั้ม
// =========================================

// =========================================
// ดึงรายละเอียดอัลบั้มและภาพทั้งหมดในอัลบั้ม
// =========================================
exports.getGalleryDetail = async (req, res) => {

    try {

        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT

                a.activity_id,
                a.activity_name,
                a.activity_date,
                a.description,
                a.start_time,
                a.end_time,
                a.latitude,
                a.longitude,

                COALESCE(
                    (
                        SELECT GROUP_CONCAT(
                            selected_location.location_name
                            ORDER BY activity_location.sort_order
                            SEPARATOR ', '
                        )
                        FROM activity_locations activity_location
                        INNER JOIN locations selected_location
                            ON selected_location.location_id = activity_location.location_id
                        WHERE activity_location.activity_id = a.activity_id
                    ),
                    l.location_name
                ) AS location_name,

                MIN(ai.image_path) AS cover_image

            FROM activities a

            LEFT JOIN locations l

                ON l.location_id = a.location_id

            LEFT JOIN activity_images ai

                ON ai.activity_id = a.activity_id

            WHERE a.activity_id = ?

            GROUP BY

                a.activity_id,
                a.activity_name,
                a.activity_date,
                a.description,
                a.start_time,
                a.end_time,
                a.latitude,
                a.longitude,
                l.location_name
        `, [id]);

        if (rows.length === 0) {

            return res.status(404).json({

                success: false,

                message: "ไม่พบอัลบั้ม"

            });

        }

        const [images] = await db.query(`
            SELECT

                image_id,
                image_path,
                latitude,
                longitude,
                captured_at

            FROM activity_images

            WHERE activity_id = ?

            ORDER BY image_id ASC
        `, [id]);

        const [selectedLocations] = await db.query(`
            SELECT
                locations.location_id,
                locations.location_name,
                locations.latitude,
                locations.longitude
            FROM activity_locations
            INNER JOIN locations
                ON locations.location_id = activity_locations.location_id
            WHERE activity_locations.activity_id = ?
            ORDER BY activity_locations.sort_order
        `, [id]);
        const [customLocations] = await db.query(`
            SELECT
                custom_location_id,
                location_name,
                latitude,
                longitude,
                sort_order
            FROM activity_custom_locations
            WHERE activity_id = ?
            ORDER BY sort_order, custom_location_id
        `, [id]);

        const locations = selectedLocations.length > 0
            ? selectedLocations.map((location) => ({
                ...location,
                label: location.location_name,
                type: "selected"
            }))
            : isValidCoordinate(rows[0].latitude, rows[0].longitude)
                ? [{
                    location_name: rows[0].location_name,
                    label: rows[0].location_name,
                    latitude: rows[0].latitude,
                    longitude: rows[0].longitude,
                    type: "selected"
                }]
                : [];
        locations.push(...customLocations.map((location, index) => ({
            ...location,
            label: location.location_name || `จุดปักเอง ${index + 1}`,
            type: "custom"
        })));

        for (const image of images) {
            if (!isValidCoordinate(image.latitude, image.longitude)) {
                continue;
            }

            const photoLocation = {
                latitude: image.latitude,
                longitude: image.longitude
            };
            const existing = locations.find((location) =>
                getCoordinateDistanceMeters(location, photoLocation) < 20
            );
            if (existing) {
                existing.image_count = (existing.image_count || 0) + 1;
                continue;
            }

            const nearbyLocation = locations
                .map((location) => ({
                    location,
                    distance: getCoordinateDistanceMeters(location, photoLocation)
                }))
                .filter((entry) => entry.distance < 75)
                .sort((first, second) => first.distance - second.distance)[0]?.location;
            const imageLocationCount = locations.filter((location) =>
                location.type === "photo"
            ).length;

            locations.push({
                ...photoLocation,
                label: nearbyLocation?.label || `ตำแหน่งจากรูป ${imageLocationCount + 1}`,
                type: "photo",
                image_count: 1
            });
        }

        const album = {

            ...rows[0],

            start_time: rows[0].start_time,

            end_time: rows[0].end_time,

            latitude: rows[0].latitude,

            longitude: rows[0].longitude,

            cover_image: normalizePath(rows[0].cover_image),

            total_images: images.length,

            locations,
            location_name: locations
                .map((location) => location.label)
                .filter((name, index, names) => name && names.indexOf(name) === index)
                .join(", ") || rows[0].location_name,

            images: images.map(image => ({

                image_id: image.image_id,

                image_path: normalizePath(image.image_path),

                latitude: image.latitude,

                longitude: image.longitude,

                captured_at: image.captured_at

            }))
                    };

        return res.json({

            success: true,

            data: album

        });

    } catch (err) {

        console.error("Gallery Detail Error :", err);

        return res.status(500).json({

            success: false,

            error: err.message

        });

    }

};

// =========================================
// อัปโหลดรูปเข้าสู่อัลบั้มที่มีอยู่
// =========================================

// =========================================
// อัปโหลดภาพเข้ากลุ่มอัลบั้มและอัปเดต metadata ที่ได้รับอนุญาต
// =========================================
exports.uploadGalleryImages = async (req, res) => {

    try {

        const activityId = req.params.id || req.body.activity_id;

        if (!activityId) {

            return res.status(400).json({

                success: false,

                message: "ไม่พบรหัสอัลบั้ม"

            });

        }

        const [activities] = await db.query(
            `SELECT activity_id FROM activities WHERE activity_id = ?`,
            [activityId]
        );

        if (activities.length === 0) {

            return res.status(404).json({

                success: false,

                message: "ไม่พบอัลบั้ม"

            });

        }

        if (!req.files || req.files.length === 0) {

            return res.status(400).json({

                success: false,

                message: "ไม่พบไฟล์ที่อัปโหลด"

            });

        }

        const files = [];
        for (const uploadedFile of req.files) {
            const metadata = uploadedFile.mimetype === "image/jpeg"
                ? await readImageMetadata(uploadedFile.path)
                : { latitude: null, longitude: null, captured_at: null };
            const file = {
                filename: uploadedFile.filename,
                path: "/uploads/activities/" + uploadedFile.filename,
                ...metadata
            };

            await db.query(
                `INSERT INTO activity_images
                (
                    activity_id,
                    image_path,
                    latitude,
                    longitude,
                    captured_at
                )
                VALUES (?, ?, ?, ?, ?)`,
                [
                    activityId,
                    file.path,
                    file.latitude,
                    file.longitude,
                    file.captured_at
                ]
            );
            files.push(file);
        }

        const isSuperAdmin =
            req.user?.role === "admin" &&
            req.user.adminLevel === "super_admin";

        // Only Super Admin can edit activity metadata while uploading images.
        const updates = [];
        const params = [];
        if (isSuperAdmin && req.body.description) {
            updates.push("description = ?");
            params.push(req.body.description);
        }
        if (isSuperAdmin && req.body.activity_date) {
            updates.push("activity_date = ?");
            params.push(req.body.activity_date);
        }
        if (isSuperAdmin && req.body.start_time) {
            updates.push("start_time = ?");
            params.push(req.body.start_time);
        }
        if (isSuperAdmin && req.body.end_time) {
            updates.push("end_time = ?");
            params.push(req.body.end_time);
        }

        if (updates.length > 0) {
            params.push(activityId);
            const updateSql = `UPDATE activities SET ${updates.join(", ")} WHERE activity_id = ?`;
            await db.query(updateSql, params);
        }

        return res.json({
            success: true,
            files
        });

    } catch (err) {

        console.error("Gallery Upload Error :", err);

        return res.status(500).json({

            success: false,

            error: err.message

        });

    }

};

// =========================================
// ดาวน์โหลดอัลบั้ม ZIP
// =========================================

// =========================================
// ดาวน์โหลดรูปภาพทั้งอัลบั้มเป็นไฟล์ ZIP
// =========================================
exports.downloadAlbum = async (req, res) => {

    try {

        const { id } = req.params;

        // ตรวจสอบอัลบั้ม
        const [activities] = await db.query(
            `
            SELECT
                activity_name
            FROM activities
            WHERE activity_id = ?
            `,
            [id]
        );

        if (activities.length === 0) {

            return res.status(404).json({

                success: false,

                message: "ไม่พบอัลบั้ม"

            });

        }

        // ดึงรูปทั้งหมด
        const [images] = await db.query(
            `
            SELECT
                image_path
            FROM activity_images
            WHERE activity_id = ?
            ORDER BY image_id ASC
            `,
            [id]
        );

        if (images.length === 0) {

            return res.status(404).json({

                success: false,

                message: "ไม่มีรูปภาพในอัลบั้ม"

            });

        }

        // ตั้งชื่อไฟล์ ZIP
        const zipName = `${activities[0].activity_name}.zip`
            .replace(/[\\/:*?"<>|]/g, "_");

        res.attachment(zipName);

        const archive = archiver("zip", {

            zlib: { level: 9 }

        });

        archive.on("warning", (err) => {

            console.warn("Archive Warning :", err);

        });

        archive.on("error", (err) => {

            console.error("Archive Error :", err);

            if (!res.headersSent) {

                return res.status(500).json({

                    success: false,

                    error: err.message

                });

            }

        });

        archive.pipe(res);

        let totalFiles = 0;

        for (const image of images) {

            const relativePath = image.image_path.replace(/^[/\\]+/, "");

            const fullPath = path.join(
                __dirname,
                "..",
                relativePath
            );

            if (fs.existsSync(fullPath)) {

                archive.file(fullPath, {

                    name: path.basename(fullPath)

                });

                totalFiles++;

            } else {

                console.warn("ไม่พบไฟล์ :", fullPath);

            }

        }

        if (totalFiles === 0) {

            return res.status(404).json({

                success: false,

                message: "ไม่พบไฟล์รูปภาพ"

            });

        }

        console.log(`ZIP : ${totalFiles} files`);

        await archive.finalize();

    } catch (err) {

        console.error("Download Album Error :", err);

        if (!res.headersSent) {

            return res.status(500).json({

                success: false,

                error: err.message

            });

        }

    }

};

// ลบรูปเดี่ยวจาก activity_images
exports.deleteImage = async (req, res) => {
    try {
        const imageId = req.params.id;

        const [rows] = await db.query(`SELECT image_path, activity_id FROM activity_images WHERE image_id = ?`, [imageId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบรูป' });
        }

        const image = rows[0];

        // ตรวจสอบสิทธิ์: ผู้เรียกต้องเป็นแอดมิน หรือเป็นเจ้าของอัลบั้ม (member_id)
        const [[activity]] = await db.query(`SELECT member_id, admin_id FROM activities WHERE activity_id = ?`, [image.activity_id]);
        const caller = req.user || {};
        const isSuperAdmin =
            caller.role === "admin" &&
            caller.adminLevel === "super_admin";
        if (!(isSuperAdmin || caller.id === activity.member_id)) {
            return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ลบรูป' });
        }

        // ลบไฟล์จริง
        const filePath = path.join(__dirname, '..', image.image_path.replace(/^\/+/, ''));
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // ลบเรคคอร์ด
        await db.query(`DELETE FROM activity_images WHERE image_id = ?`, [imageId]);

        return res.json({ success: true, message: 'ลบรูปสำเร็จ', activity_id: image.activity_id });

    } catch (err) {
        console.error('Delete Image Error :', err);
        return res.status(500).json({ success: false, error: err.message });
    }
};