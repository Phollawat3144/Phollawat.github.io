// =====================================================
// Route สำหรับจัดการข้อมูลสถานที่
// เปิด CRUD endpoints สำหรับ admin ที่มีสิทธิ์เข้าถึง
// =====================================================




const express = require("express");

const router = express.Router();

const locationController = require("../controllers/location.controller");
const auth = require("../middlewares/auth");
const { requireSuperAdmin } = require("../middlewares/adminPermissions");

// ============================
// แสดงสถานที่ทั้งหมด
// ============================

router.get(

    "/",

    locationController.getLocations

);

// ============================
// แสดงสถานที่ตาม id
// ============================

router.get(

    "/:id",

    locationController.getLocationById

);

// ============================
// เพิ่มสถานที่
// ============================

router.post(

    "/",

    auth,
    requireSuperAdmin,
    locationController.createLocation

);

// ============================
// แก้ไขสถานที่
// ============================

router.put(

    "/:id",

    auth,
    requireSuperAdmin,
    locationController.updateLocation

);

// ============================
// ลบสถานที่
// ============================

router.delete(

    "/:id",

    auth,
    requireSuperAdmin,
    locationController.deleteLocation

);

module.exports = router;