// =====================================================
// Controller สำหรับจัดการข้อมูลกิจกรรม
// ดึงรายการ/รายละเอียดกิจกรรม เพิ่ม/แก้ไข/ลบ และโหลดรูปภาพที่เกี่ยวข้อง
// =====================================================




const db = require("../config/db");
const fs = require("fs");
const path = require("path");

const normalizeLocationIds = (locationIds, legacyLocationId) => {
    const submittedIds = Array.isArray(locationIds)
        ? locationIds
        : locationIds
            ? [locationIds]
            : legacyLocationId
                ? [legacyLocationId]
                : [];
    const normalizedIds = submittedIds
        .map((id) => Number(id))
        .filter((id) => Number.isSafeInteger(id) && id > 0);

    return [...new Set(normalizedIds)];
};

const locationsExist = async (connection, locationIds) => {
    if (locationIds.length === 0) {
        return true;
    }

    const placeholders = locationIds.map(() => "?").join(", ");
    const [rows] = await connection.query(
        `SELECT location_id FROM locations WHERE location_id IN (${placeholders})`,
        locationIds
    );

    return rows.length === locationIds.length;
};

const normalizeCustomLocations = (customLocations) => {
    if (customLocations === undefined) {
        return [];
    }

    if (!Array.isArray(customLocations)) {
        return null;
    }

    const normalizedLocations = [];
    for (const location of customLocations) {
        const latitude = Number(location?.latitude);
        const longitude = Number(location?.longitude);

        if (
            location?.latitude === null ||
            location?.latitude === undefined ||
            location?.latitude === "" ||
            location?.longitude === null ||
            location?.longitude === undefined ||
            location?.longitude === "" ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            Math.abs(latitude) > 90 ||
            Math.abs(longitude) > 180
        ) {
            return null;
        }

        const label = typeof location.label === "string" ? location.label.trim() : "";
        if (label.length > 255) {
            return null;
        }

        normalizedLocations.push({ latitude, longitude, label });
    }

    return normalizedLocations;
};

const normalizeImageMetadata = (image) => {
    const latitude = Number(image?.latitude);
    const longitude = Number(image?.longitude);
    const hasCoordinates =
        image?.latitude !== null &&
        image?.latitude !== undefined &&
        image?.latitude !== "" &&
        image?.longitude !== null &&
        image?.longitude !== undefined &&
        image?.longitude !== "" &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        Math.abs(latitude) <= 90 &&
        Math.abs(longitude) <= 180;
    const capturedAt = typeof image?.captured_at === "string" &&
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(image.captured_at)
        ? image.captured_at
        : null;

    return {
        latitude: hasCoordinates ? latitude : null,
        longitude: hasCoordinates ? longitude : null,
        captured_at: capturedAt
    };
};

const getCoordinateDistanceMeters = (first, second) => {
    if (
        first.latitude === null ||
        first.latitude === undefined ||
        first.longitude === null ||
        first.longitude === undefined ||
        second.latitude === null ||
        second.latitude === undefined ||
        second.longitude === null ||
        second.longitude === undefined
    ) {
        return Infinity;
    }

    const earthRadiusMeters = 6371000;
    const latitudeDifference = (Number(second.latitude) - Number(first.latitude)) * Math.PI / 180;
    const longitudeDifference = (Number(second.longitude) - Number(first.longitude)) * Math.PI / 180;
    const haversine = Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(Number(first.latitude) * Math.PI / 180) *
        Math.cos(Number(second.latitude) * Math.PI / 180) *
        Math.sin(longitudeDifference / 2) ** 2;

    return 2 * earthRadiusMeters *
        Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const attachActivityLocations = async (rows) => {
    if (rows.length === 0) {
        return;
    }

    const activityIds = rows.map((row) => row.activity_id);
    const placeholders = activityIds.map(() => "?").join(", ");
    const [locationRows] = await db.query(
        `
        SELECT
            activity_locations.activity_id,
            locations.location_id,
            locations.location_name,
            locations.latitude,
            locations.longitude
        FROM activity_locations
        INNER JOIN locations
            ON locations.location_id = activity_locations.location_id
        WHERE activity_locations.activity_id IN (${placeholders})
        ORDER BY activity_locations.activity_id, activity_locations.sort_order
        `,
        activityIds
    );
    const locationsByActivity = new Map();

    for (const location of locationRows) {
        const activityLocations = locationsByActivity.get(location.activity_id) || [];
        activityLocations.push({
            location_id: location.location_id,
            location_name: location.location_name,
            latitude: location.latitude,
            longitude: location.longitude
        });
        locationsByActivity.set(location.activity_id, activityLocations);
    }

    const [customLocationRows] = await db.query(
        `
        SELECT activity_id, custom_location_id, latitude, longitude, location_name, sort_order
        FROM activity_custom_locations
        WHERE activity_id IN (${placeholders})
        ORDER BY activity_id, sort_order, custom_location_id
        `,
        activityIds
    );
    const customLocationsByActivity = new Map();

    for (const location of customLocationRows) {
        const activityCustomLocations =
            customLocationsByActivity.get(location.activity_id) || [];
        activityCustomLocations.push({
            custom_location_id: location.custom_location_id,
            latitude: location.latitude,
            longitude: location.longitude,
            label: location.location_name || `จุดปักเอง ${activityCustomLocations.length + 1}`,
            is_custom: true
        });
        customLocationsByActivity.set(location.activity_id, activityCustomLocations);
    }

    const [imageLocationRows] = await db.query(
        `
        SELECT activity_id, image_id, latitude, longitude
        FROM activity_images
        WHERE activity_id IN (${placeholders})
            AND latitude IS NOT NULL
            AND longitude IS NOT NULL
        ORDER BY activity_id, image_id
        `,
        activityIds
    );
    const [knownLocationRows] = await db.query(
        "SELECT location_name, latitude, longitude FROM locations"
    );
    const imageLocationsByActivity = new Map();

    for (const imageLocation of imageLocationRows) {
        const activityImageLocations =
            imageLocationsByActivity.get(imageLocation.activity_id) || [];
        const existingLocation = activityImageLocations.find((location) =>
            getCoordinateDistanceMeters(location, imageLocation) < 20
        );

        if (existingLocation) {
            existingLocation.image_count += 1;
            continue;
        }

        activityImageLocations.push({
            latitude: imageLocation.latitude,
            longitude: imageLocation.longitude,
            label: `ตำแหน่งจากรูป ${activityImageLocations.length + 1}`,
            image_count: 1,
            is_image_location: true
        });
        imageLocationsByActivity.set(imageLocation.activity_id, activityImageLocations);
    }

    for (const row of rows) {
        const activityLocations = locationsByActivity.get(row.activity_id) || [];
        if (activityLocations.length === 0 && row.location_id) {
            activityLocations.push({
                location_id: row.location_id,
                location_name: row.location_name,
                latitude: row.latitude,
                longitude: row.longitude
            });
        }

        const customLocations = customLocationsByActivity.get(row.activity_id) || [];
        const imageLocations = imageLocationsByActivity.get(row.activity_id) || [];
        for (const imageLocation of imageLocations) {
            const nearestLocation = [
                ...activityLocations,
                ...customLocations,
                ...knownLocationRows
            ]
                .map((location) => ({
                    location,
                    distance: getCoordinateDistanceMeters(location, imageLocation)
                }))
                .filter((entry) => entry.distance < 75)
                .sort((first, second) => first.distance - second.distance)[0]?.location;

            if (nearestLocation) {
                imageLocation.label =
                    nearestLocation.location_name ||
                    nearestLocation.label ||
                    imageLocation.label;
            }
        }
        const distinctImageLocations = imageLocations.filter((imageLocation) =>
            ![...activityLocations, ...customLocations].some((location) =>
                getCoordinateDistanceMeters(location, imageLocation) < 20
            )
        );
        row.custom_locations = customLocations;
        row.image_locations = distinctImageLocations;
        row.locations = [...activityLocations, ...customLocations, ...distinctImageLocations];
        row.location_ids = activityLocations.map((location) => location.location_id);
        row.location_name = activityLocations
            .map((location) => location.location_name)
            .filter(Boolean)
            .concat(customLocations.map((location) => location.label))
            .concat(distinctImageLocations.map((location) => location.label))
            .filter(Boolean)
            .join(", ") || row.location_name;
    }
};

// ======================================================
// แสดงกิจกรรมทั้งหมด
// ใช้ทั้งฝั่ง Admin และ Member
// ======================================================
exports.getActivities = async (req, res) => {

    try {

        const memberId = req.query.member_id;

        let query = `
            SELECT
                a.activity_id,
                a.activity_name,

                DATE_FORMAT(
                    a.activity_date,
                    '%Y-%m-%d'
                ) AS activity_date,

                a.start_time,
                a.end_time,

                a.description,

                a.location_id,

                a.member_id,
                a.admin_id,
                a.news_id,

                a.latitude,
                a.longitude,

                l.location_name,

                EXISTS (
                    SELECT 1
                    FROM member_uploads mu
                    WHERE mu.activity_id = a.activity_id
                ) AS has_member_upload

            FROM activities a

            LEFT JOIN locations l
                ON a.location_id = l.location_id

        `;

        const params = [];

        // --------------------------------------------------
        // กรณีต้องการเฉพาะกิจกรรมของสมาชิก
        // --------------------------------------------------
        if (memberId) {

            query += `
                WHERE a.member_id = ?
            `;

            params.push(memberId);

        }

        query += `
            ORDER BY a.activity_id DESC
        `;

        const [rows] = await db.query(
            query,
            params
        );
        await attachActivityLocations(rows);

        // --------------------------------------------------
        // ดึงรูปของกิจกรรมแต่ละกิจกรรม
        // --------------------------------------------------
        for (const row of rows) {

            const [images] = await db.query(

                `
                SELECT
                    image_id,
                    image_path,
                    latitude,
                    longitude,
                    captured_at

                FROM activity_images

                WHERE activity_id = ?

                ORDER BY image_id ASC
                `,

                [row.activity_id]

            );

            row.images = images;

            row.activity_image =
                images.length > 0
                    ? images[0].image_path
                    : null;

        }

        res.json({

            success: true,

            total: rows.length,

            data: rows

        });

    }

    catch (err) {

        console.error(
            "getActivities error:",
            err
        );

        res.status(500).json({

            success: false,

            message: "ไม่สามารถโหลดข้อมูลกิจกรรมได้",

            error: err.message

        });

    }

};


// ======================================================
// แสดงกิจกรรม 1 รายการ
// ======================================================
exports.getActivityById = async (req, res) => {

    try {

        const { id } = req.params;

        const [rows] = await db.query(

            `
            SELECT
                a.activity_id,
                a.activity_name,

                DATE_FORMAT(
                    a.activity_date,
                    '%Y-%m-%d'
                ) AS activity_date,

                a.start_time,
                a.end_time,

                a.description,

                a.location_id,

                a.member_id,
                a.admin_id,
                a.news_id,

                a.latitude,
                a.longitude,

                l.location_name

            FROM activities a

            LEFT JOIN locations l
                ON a.location_id = l.location_id

            WHERE a.activity_id = ?
            `,

            [id]

        );

        if (rows.length === 0) {

            return res.status(404).json({

                success: false,

                message: "ไม่พบกิจกรรม"

            });

        }
        await attachActivityLocations(rows);

        // --------------------------------------------------
        // รูปกิจกรรม
        // --------------------------------------------------
        const [images] = await db.query(

            `
            SELECT
                image_id,
                image_path,
                latitude,
                longitude,
                captured_at

            FROM activity_images

            WHERE activity_id = ?

            ORDER BY image_id ASC
            `,

            [id]

        );

        rows[0].images = images;

        rows[0].activity_image =
            images.length > 0
                ? images[0].image_path
                : null;

        res.json({

            success: true,

            data: rows[0]

        });

    }

    catch (err) {

        console.error(
            "getActivityById error:",
            err
        );

        res.status(500).json({

            success: false,

            message: "ไม่สามารถโหลดข้อมูลกิจกรรมได้",

            error: err.message

        });

    }

};


// ======================================================
// เพิ่มกิจกรรม
// ฝั่ง Admin
// ======================================================
exports.createActivity = async (req, res) => {

    try {

        const {

            activity_name,
            activity_date,

            start_time,
            end_time,

            description,

            location_id,
            location_ids,
            custom_locations,

            member_id,
            admin_id,
            news_id,

            latitude,
            longitude,

            images

        } = req.body;

        const normalizedActivityName =
            typeof activity_name === "string"
                ? activity_name.trim()
                : "";

        // --------------------------------------------------
        // ตรวจสอบข้อมูลที่จำเป็น
        // --------------------------------------------------
        if (!normalizedActivityName) {

            return res.status(400).json({

                success: false,

                message: "กรุณาระบุชื่อกิจกรรม"

            });

        }
        const normalizedLocationIds = normalizeLocationIds(location_ids, location_id);
        if (
            (Array.isArray(location_ids) && normalizedLocationIds.length !== location_ids.length) ||
            (location_ids && !Array.isArray(location_ids) && normalizedLocationIds.length !== 1)
        ) {
            return res.status(400).json({
                success: false,
                message: "ข้อมูลสถานที่ไม่ถูกต้อง"
            });
        }
        const primaryLocationId = normalizedLocationIds[0] || null;
        const normalizedCustomLocations = normalizeCustomLocations(custom_locations);
        if (normalizedCustomLocations === null) {
            return res.status(400).json({
                success: false,
                message: "ข้อมูลตำแหน่งที่ปักเองไม่ถูกต้อง"
            });
        }


        const connection = await db.getConnection();
        let lockAcquired = false;
        let result;
        try {
            const [lockRows] = await connection.query(
                "SELECT GET_LOCK(?, 5) AS acquired",
                ["activities:create-limit"]
            );

            if (lockRows[0].acquired !== 1) {
                return res.status(503).json({
                    success: false,
                    message: "ระบบกำลังเพิ่มกิจกรรมอื่น กรุณาลองใหม่อีกครั้ง"
                });
            }
            lockAcquired = true;

            if (!await locationsExist(connection, normalizedLocationIds)) {
                return res.status(400).json({
                    success: false,
                    message: "ไม่พบสถานที่ที่เลือก"
                });
            }

            const [existingActivities] = await connection.query(
                `
                SELECT activity_id
                FROM activities
                WHERE LOWER(TRIM(activity_name)) = LOWER(?)
                LIMIT 1
                `,
                [normalizedActivityName]
            );

            if (existingActivities.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "ชื่อกิจกรรมนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น"
                });
            }

            const [countRows] = await connection.query(
                "SELECT COUNT(*) AS total FROM activities"
            );
            if (countRows[0].total >= 20) {
                return res.status(409).json({
                    success: false,
                    message: "เพิ่มกิจกรรมไม่ได้ เนื่องจากระบบกำหนดจำนวนสูงสุดไว้ 20 กิจกรรม"
                });
            }

            // --------------------------------------------------
            // เพิ่มกิจกรรม
            // --------------------------------------------------
            [result] = await connection.query(
                `
                INSERT INTO activities
                (
                    activity_name,
                    activity_date,
                    start_time,
                    end_time,
                    description,
                    location_id,
                    member_id,
                    admin_id,
                    news_id,
                    latitude,
                    longitude
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    normalizedActivityName,
                    activity_date || null,
                    start_time || null,
                    end_time || null,
                    description || null,
                    primaryLocationId,
                    member_id || null,
                    admin_id || null,
                    news_id || null,
                    latitude || null,
                    longitude || null
                ]
            );
            for (const [sortOrder, selectedLocationId] of normalizedLocationIds.entries()) {
                await connection.query(
                    `
                    INSERT INTO activity_locations
                        (activity_id, location_id, sort_order)
                    VALUES (?, ?, ?)
                    `,
                    [result.insertId, selectedLocationId, sortOrder]
                );
            }
            for (const [sortOrder, customLocation] of normalizedCustomLocations.entries()) {
                await connection.query(
                    `
                    INSERT INTO activity_custom_locations
                        (activity_id, latitude, longitude, location_name, sort_order)
                    VALUES (?, ?, ?, ?, ?)
                    `,
                    [
                        result.insertId,
                        customLocation.latitude,
                        customLocation.longitude,
                        customLocation.label || null,
                        sortOrder
                    ]
                );
            }
        } finally {
            if (lockAcquired) {
                await connection.query(
                    "SELECT RELEASE_LOCK(?)",
                    ["activities:create-limit"]
                );
            }
            connection.release();
        }


        const activityId =
            result.insertId;


        // --------------------------------------------------
        // เพิ่มรูปกิจกรรม
        // --------------------------------------------------
        if (
            Array.isArray(images) &&
            images.length > 0
        ) {

            for (const image of images) {

                const imagePath =
                    image?.path ||
                    image?.image_path ||
                    null;

                if (!imagePath) {
                    continue;
                }

                const metadata = normalizeImageMetadata(image);

                await db.query(

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
                        activityId,
                        imagePath,
                        metadata.latitude,
                        metadata.longitude,
                        metadata.captured_at
                    ]

                );

            }

        }


        res.status(201).json({

            success: true,

            message: "เพิ่มกิจกรรมสำเร็จ",

            activity_id: activityId

        });

    }

    catch (err) {

        console.error(
            "createActivity error:",
            err
        );

        res.status(500).json({

            success: false,

            message: "ไม่สามารถเพิ่มกิจกรรมได้",

            error: err.message

        });

    }

};


// ======================================================
// แก้ไขกิจกรรม
// ฝั่ง Admin
// ======================================================
exports.updateActivity = async (req, res) => {

    try {

        const { id } = req.params;

        const {

            activity_name,
            activity_date,

            start_time,
            end_time,

            description,

            location_id,
            location_ids,
            custom_locations,

            member_id,
            admin_id,
            news_id,

            latitude,
            longitude,

            images

        } = req.body;


        // --------------------------------------------------
        // ตรวจสอบว่ามีกิจกรรมหรือไม่
        // --------------------------------------------------
        const [check] = await db.query(

            `
            SELECT activity_id

            FROM activities

            WHERE activity_id = ?
            `,

            [id]

        );

        if (check.length === 0) {

            return res.status(404).json({

                success: false,

                message: "ไม่พบกิจกรรม"

            });

        }
        const normalizedLocationIds = normalizeLocationIds(location_ids, location_id);
        if (
            (Array.isArray(location_ids) && normalizedLocationIds.length !== location_ids.length) ||
            (location_ids && !Array.isArray(location_ids) && normalizedLocationIds.length !== 1)
        ) {
            return res.status(400).json({
                success: false,
                message: "ข้อมูลสถานที่ไม่ถูกต้อง"
            });
        }
        const primaryLocationId = normalizedLocationIds[0] || null;
        const normalizedCustomLocations = normalizeCustomLocations(custom_locations);
        if (normalizedCustomLocations === null) {
            return res.status(400).json({
                success: false,
                message: "ข้อมูลตำแหน่งที่ปักเองไม่ถูกต้อง"
            });
        }

        if (!await locationsExist(db, normalizedLocationIds)) {
            return res.status(400).json({
                success: false,
                message: "ไม่พบสถานที่ที่เลือก"
            });
        }

        // --------------------------------------------------
        // แก้ไขข้อมูลกิจกรรม
        // --------------------------------------------------
        await db.query(

            `
            UPDATE activities

            SET

                activity_name = ?,
                activity_date = ?,

                start_time = ?,
                end_time = ?,

                description = ?,

                location_id = ?,

                member_id = ?,
                admin_id = ?,
                news_id = ?,

                latitude = ?,
                longitude = ?

            WHERE activity_id = ?
            `,

            [

                activity_name,

                activity_date || null,

                start_time || null,
                end_time || null,

                description || null,

                primaryLocationId,

                member_id || null,
                admin_id || null,
                news_id || null,

                latitude || null,
                longitude || null,

                id

            ]

        );

        await db.query(
            "DELETE FROM activity_locations WHERE activity_id = ?",
            [id]
        );
        for (const [sortOrder, selectedLocationId] of normalizedLocationIds.entries()) {
            await db.query(
                `
                INSERT INTO activity_locations
                    (activity_id, location_id, sort_order)
                VALUES (?, ?, ?)
                `,
                [id, selectedLocationId, sortOrder]
            );
        }
        await db.query(
            "DELETE FROM activity_custom_locations WHERE activity_id = ?",
            [id]
        );
        for (const [sortOrder, customLocation] of normalizedCustomLocations.entries()) {
            await db.query(
                `
                INSERT INTO activity_custom_locations
                    (activity_id, latitude, longitude, location_name, sort_order)
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    id,
                    customLocation.latitude,
                    customLocation.longitude,
                    customLocation.label || null,
                    sortOrder
                ]
            );
        }


        // --------------------------------------------------
        // ถ้ามีการส่ง images มา
        // ให้ลบรายการรูปเดิมก่อน
        // --------------------------------------------------
        if (Array.isArray(images)) {

            await db.query(

                `
                DELETE FROM activity_images

                WHERE activity_id = ?
                `,

                [id]

            );


            // --------------------------------------------------
            // เพิ่มรูปใหม่
            // --------------------------------------------------
            for (const image of images) {

                const imagePath =
                    image?.path ||
                    image?.image_path ||
                    null;

                if (!imagePath) {
                    continue;
                }

                const metadata = normalizeImageMetadata(image);

                await db.query(

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
                        id,
                        imagePath,
                        metadata.latitude,
                        metadata.longitude,
                        metadata.captured_at
                    ]

                );

            }

        }


        res.json({

            success: true,

            message: "แก้ไขกิจกรรมสำเร็จ"

        });

    }

    catch (err) {

        console.error(
            "updateActivity error:",
            err
        );

        res.status(500).json({

            success: false,

            message: "ไม่สามารถแก้ไขกิจกรรมได้",

            error: err.message

        });

    }

};


// ======================================================
// ลบกิจกรรม
// ฝั่ง Admin
// ======================================================
exports.deleteActivity = async (req, res) => {

    try {

        const { id } = req.params;


        // --------------------------------------------------
        // ดึงรูปก่อนลบ
        // --------------------------------------------------
        const [images] = await db.query(

            `
            SELECT image_path

            FROM activity_images

            WHERE activity_id = ?
            `,

            [id]

        );


        // --------------------------------------------------
        // ลบไฟล์รูปจริง
        // --------------------------------------------------
        for (const img of images) {

            if (!img.image_path) {
                continue;
            }

            const cleanPath =
                img.image_path.replace(
                    /^\/+/,
                    ""
                );

            const filePath =
                path.join(
                    __dirname,
                    "..",
                    cleanPath
                );


            if (
                fs.existsSync(filePath)
            ) {

                try {

                    fs.unlinkSync(
                        filePath
                    );

                }

                catch (fileErr) {

                    console.log(
                        "ลบไฟล์รูปไม่สำเร็จ:",
                        fileErr.message
                    );

                }

            }

        }


        // --------------------------------------------------
        // ลบข้อมูลรูป
        // --------------------------------------------------
        await db.query(

            `
            DELETE FROM activity_images

            WHERE activity_id = ?
            `,

            [id]

        );


        // --------------------------------------------------
        // ลบกิจกรรม
        // --------------------------------------------------
        const [result] = await db.query(

            `
            DELETE FROM activities

            WHERE activity_id = ?
            `,

            [id]

        );


        if (
            result.affectedRows === 0
        ) {

            return res.status(404).json({

                success: false,

                message: "ไม่พบกิจกรรม"

            });

        }


        res.json({

            success: true,

            message: "ลบกิจกรรมสำเร็จ"

        });

    }

    catch (err) {

        console.error(
            "deleteActivity error:",
            err
        );

        res.status(500).json({

            success: false,

            message: "ไม่สามารถลบกิจกรรมได้",

            error: err.message

        });

    }

};