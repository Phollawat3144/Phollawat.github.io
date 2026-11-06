// จุดประสงค์: รวบรวมข้อมูลกิจกรรม รูปภาพ และพิกัดเพื่อส่งคำขออัปโหลดของสมาชิก
import {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import {
    FaFolderOpen,
    FaCalendarAlt,
    FaClock,
    FaMapMarkerAlt,
    FaCloudUploadAlt,
    FaTimes,
    FaImages,
    FaPlus
} from "react-icons/fa";

import Swal from "sweetalert2";

import api from "../../services/api";


/* =========================================================
   Helpers
========================================================= */

// จัดการเหตุการณ์และการเปลี่ยนแปลงข้อมูล

const createDefaultForm = () => ({
    activity_id: "",
    location_id: "",
    upload_date: "",
    upload_time: "",
    end_time: "",
    description: "",
    latitude: "-",
    longitude: "-"
});


const normalizeTime = (time) => {

    if (!time) {
        return "";
    }

    return String(time).slice(0, 5);

};


const normalizeDate = (date) => {

    if (!date) {
        return "";
    }

    return String(date).slice(0, 10);

};


const formatThaiDate = (date) => {

    if (!date) {
        return "-";
    }

    const value =
        String(date).slice(0, 10);

    const parts =
        value.split("-");

    if (parts.length !== 3) {
        return value;
    }

    const year =
        Number(parts[0]) + 543;

    return `${parts[2]}/${parts[1]}/${year}`;

};


/* =========================================================
   Component
========================================================= */

function UploadActivity() {

    /* =====================================================
       State
    ===================================================== */

    // สถานะและข้อมูลที่คอมโพเนนต์ใช้

    const [images, setImages] =
        useState([]);

    const [activities, setActivities] =
        useState([]);

    const [locations, setLocations] =
        useState([]);

    const [loading, setLoading] =
        useState(false);

    const [loadingActivities, setLoadingActivities] =
        useState(true);

    const [loadingLocations, setLoadingLocations] =
        useState(true);

    const [gettingLocation, setGettingLocation] =
        useState(false);

    const [locationStatus, setLocationStatus] =
        useState("");

    const [locationError, setLocationError] =
        useState(false);

    const [activityDropdownOpen, setActivityDropdownOpen] =
        useState(false);

    const [form, setForm] =
        useState(createDefaultForm());

    const activitySelectionOnly = true;

    const fileInputRef =
        useRef(null);

    const sharedFieldLabelStyle = {
        fontSize: 17,
        height: 24,
        lineHeight: "24px",
        display: "block",
        marginBottom: 10
    };

    const sharedFieldInputStyle = {
        width: "100%",
        height: 58,
        minHeight: 58,
        borderRadius: 14,
        fontSize: 18,
        border: "1px solid #D9DEE7",
        boxSizing: "border-box"
    };


    /* =====================================================
       User
    ===================================================== */

    const storedUser = useMemo(() => {

        try {

            return JSON.parse(
                localStorage.getItem("user") ||
                sessionStorage.getItem("user") ||
                "{}"
            );

        } catch (error) {

            console.error(
                "Read user error:",
                error
            );

            return {};

        }

    }, []);


    const userId =
        storedUser?.user_id ||
        storedUser?.id ||
        storedUser?.member_id ||
        "";


    /* =====================================================
       Load Data
    ===================================================== */

    // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์

    useEffect(() => {

        loadActivities();

        loadLocations();

    }, []);


    /* =====================================================
       Load Activities
       ดึงกิจกรรมจาก Admin
    ===================================================== */

    const loadActivities = async () => {

        try {

            setLoadingActivities(true);

            const res =
                await api.get("/activities");

            if (res.data?.success) {

                setActivities(
                    Array.isArray(res.data.data)
                        ? res.data.data
                        : []
                );

            } else {

                setActivities([]);

            }

        } catch (error) {

            console.error(
                "Load activities error:",
                error
            );

            setActivities([]);

            await Swal.fire({

                icon: "error",

                title:
                    "โหลดกิจกรรมไม่สำเร็จ",

                text:
                    error.response?.data?.message ||
                    "ไม่สามารถโหลดข้อมูลกิจกรรมจากผู้ดูแลระบบได้",

                confirmButtonText:
                    "ตกลง",

                confirmButtonColor:
                    "#006664"

            });

        } finally {

            setLoadingActivities(false);

        }

    };


    /* =====================================================
       Load Locations
       ดึงสถานที่จาก Admin
    ===================================================== */

    const loadLocations = async () => {

        try {

            setLoadingLocations(true);

            const res =
                await api.get("/locations");

            if (res.data?.success) {

                setLocations(
                    Array.isArray(res.data.data)
                        ? res.data.data
                        : []
                );

            } else {

                setLocations([]);

            }

        } catch (error) {

            console.error(
                "Load locations error:",
                error
            );

            setLocations([]);

        } finally {

            setLoadingLocations(false);

        }

    };


    /* =====================================================
       Activity Change
       
       สำคัญ:
       สมาชิกสามารถเปลี่ยนกิจกรรมได้
       
       แต่ไม่สามารถแก้ชื่อกิจกรรม
       
       เมื่อเลือกกิจกรรม
       ดึงข้อมูลจาก Admin มาใส่:
       - วันที่
       - เวลาเริ่ม
       - เวลาสิ้นสุด
       - คำอธิบาย
       - ตำแหน่ง
       - Latitude
       - Longitude
    ===================================================== */

    const handleActivityChange = (e) => {

        const activityId =
            e.target.value;

        setLocationStatus("");
        setLocationError(false);


        /* -----------------------------------------------
           ยังไม่ได้เลือกกิจกรรม
        ------------------------------------------------ */

        if (!activityId) {

            setForm(
                createDefaultForm()
            );

            return;

        }


        /* -----------------------------------------------
           ค้นหากิจกรรม
        ------------------------------------------------ */

        const selectedActivity =
            activities.find(
                (item) =>
                    String(
                        item.activity_id
                    ) ===
                    String(
                        activityId
                    )
            );


        if (!selectedActivity) {

            setForm(
                createDefaultForm()
            );

            return;

        }


        /* -----------------------------------------------
           Location
        ------------------------------------------------ */

        let locationId =
            selectedActivity.location_id ||
            "";

        let latitude =
            selectedActivity.latitude;

        let longitude =
            selectedActivity.longitude;


        /* -----------------------------------------------
           ถ้ามี location_id
           ดึงพิกัดจาก locations
        ------------------------------------------------ */

        if (locationId) {

            const matchedLocation =
                locations.find(
                    (location) =>
                        String(
                            location.location_id
                        ) ===
                        String(
                            locationId
                        )
                );


            if (matchedLocation) {

                latitude =
                    matchedLocation.latitude ??
                    latitude;

                longitude =
                    matchedLocation.longitude ??
                    longitude;

            }

        }


        /* -----------------------------------------------
           ถ้าไม่มีค่า
           ให้แสดง -
        ------------------------------------------------ */

        latitude =
            latitude !== null &&
            latitude !== undefined &&
            String(latitude).trim() !== ""
                ? String(latitude)
                : "-";


        longitude =
            longitude !== null &&
            longitude !== undefined &&
            String(longitude).trim() !== ""
                ? String(longitude)
                : "-";


        /* -----------------------------------------------
           Set Form
        ------------------------------------------------ */

        setForm({

            activity_id:
                String(
                    selectedActivity.activity_id
                ),

            location_id:
                locationId
                    ? String(locationId)
                    : "",

            upload_date:
                normalizeDate(
                    selectedActivity.activity_date
                ),

            upload_time:
                normalizeTime(
                    selectedActivity.start_time
                ),

            end_time:
                normalizeTime(
                    selectedActivity.end_time
                ),

            description:
                selectedActivity.description ||
                "",

            latitude,

            longitude

        });

    };


    /* =====================================================
       Selected Activity
    ===================================================== */

    const selectedActivity =
        activities.find(
            (item) =>
                String(
                    item.activity_id
                ) ===
                String(
                    form.activity_id
                )
        );


    /* =====================================================
       Selected Location
    ===================================================== */

    const selectedLocation =
        locations.find(
            (item) =>
                String(
                    item.location_id
                ) ===
                String(
                    form.location_id
                )
        );


    /* =====================================================
       Input Change
       
       สมาชิกแก้ไขได้:
       - วันที่
       - เวลาเริ่ม
       - เวลาสิ้นสุด
       - คำอธิบาย
    ===================================================== */

    const handleInputChange = (e) => {

        if (activitySelectionOnly) {
            return;
        }

        const {
            name,
            value
        } = e.target;


        setForm(
            (prev) => ({

                ...prev,

                [name]: value

            })
        );

    };


    /* =====================================================
       Location Change
       
       สมาชิกเปลี่ยนตำแหน่งได้
    ===================================================== */

    const handleLocationChange = (e) => {

        if (activitySelectionOnly) {
            return;
        }

        const locationId =
            e.target.value;


        /* -----------------------------------------------
           ไม่เลือกตำแหน่ง
        ------------------------------------------------ */

        if (!locationId) {

            setForm(
                (prev) => ({

                    ...prev,

                    location_id: "",

                    latitude: "-",

                    longitude: "-"

                })
            );

            return;

        }


        /* -----------------------------------------------
           ค้นหาสถานที่
        ------------------------------------------------ */

        const selected =
            locations.find(
                (location) =>
                    String(
                        location.location_id
                    ) ===
                    String(
                        locationId
                    )
            );


        if (!selected) {

            return;

        }


        setForm(
            (prev) => ({

                ...prev,

                location_id:
                    String(
                        selected.location_id
                    ),

                latitude:
                    selected.latitude !==
                    null &&
                    selected.latitude !==
                    undefined &&
                    String(
                        selected.latitude
                    ).trim() !== ""
                        ? String(
                            selected.latitude
                        )
                        : "-",

                longitude:
                    selected.longitude !==
                    null &&
                    selected.longitude !==
                    undefined &&
                    String(
                        selected.longitude
                    ).trim() !== ""
                        ? String(
                            selected.longitude
                        )
                        : "-"

            })
        );

    };


    const handleGetCurrentLocation = () => {

        if (!navigator.geolocation) {

            setLocationStatus(
                "อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง"
            );
            setLocationError(true);

            return;

        }


        setGettingLocation(true);

        setLocationStatus("");
        setLocationError(false);


        navigator.geolocation.getCurrentPosition(

            (position) => {

                setForm((prev) => ({

                    ...prev,

                    latitude:
                        String(position.coords.latitude),

                    longitude:
                        String(position.coords.longitude)

                }));

                setLocationStatus(
                    "ดึงพิกัดปัจจุบันแล้ว ระบบจะบันทึกพร้อมรูปภาพที่อัปโหลด"
                );
                setLocationError(false);

                setGettingLocation(false);

            },

            (error) => {

                const errorMessages = {
                    1: "กรุณาอนุญาตให้เว็บไซต์เข้าถึงตำแหน่งของอุปกรณ์",
                    2: "ไม่สามารถระบุตำแหน่งได้ กรุณาตรวจสอบ GPS หรือเครือข่าย",
                    3: "การระบุตำแหน่งใช้เวลานานเกินไป กรุณาลองอีกครั้ง"
                };

                const message =
                    errorMessages[error.code] ||
                    "เกิดข้อผิดพลาดระหว่างระบุตำแหน่ง กรุณาลองอีกครั้ง";

                setLocationStatus(message);
                setLocationError(true);

                setGettingLocation(false);

            },

            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }

        );

    };


    /* =====================================================
       Image Preview
    ===================================================== */

    const imagePreviews =
        useMemo(() => {

            return images.map(
                (file) => ({

                    file,

                    url:
                        URL.createObjectURL(
                            file
                        )

                })
            );

        }, [images]);


    /* =====================================================
       Cleanup Image Preview
    ===================================================== */

    useEffect(() => {

        return () => {

            imagePreviews.forEach(
                (preview) => {

                    URL.revokeObjectURL(
                        preview.url
                    );

                }
            );

        };

    }, [imagePreviews]);


    /* =====================================================
       Select Images
       
       เพิ่มรูปได้ต่อเนื่อง
       ไม่กำหนดจำนวนจากฝั่ง React
    ===================================================== */

    const handleImageChange = (e) => {

        const files =
            Array.from(
                e.target.files || []
            );


        if (!files.length) {

            return;

        }


        const allowedTypes = [

            "image/jpeg",

            "image/jpg",

            "image/png",

            "image/webp"

        ];


        const invalidFile =
            files.find(
                (file) =>
                    !allowedTypes.includes(
                        file.type
                    )
            );


        if (invalidFile) {

            Swal.fire({

                icon: "error",

                title:
                    "ไฟล์ไม่ถูกต้อง",

                text:
                    "รองรับเฉพาะไฟล์ JPG/JPEG เท่านั้น และไม่เกิน 50 MB",

                confirmButtonText:
                    "ตกลง",

                confirmButtonColor:
                    "#006664"

            });

            e.target.value = "";

            return;

        }


        /* -----------------------------------------------
           เพิ่มต่อจากรูปเดิม
        ------------------------------------------------ */

        setImages(
            (prev) => [

                ...prev,

                ...files

            ]
        );


        /*
         * ทำให้สามารถเลือกไฟล์ชุดเดิมซ้ำได้
         */

        e.target.value = "";

    };


    /* =====================================================
       Remove One Image
    ===================================================== */

    const removeImage = (index) => {

        setImages(
            (prev) =>
                prev.filter(
                    (_, idx) =>
                        idx !== index
                )
        );

    };


    /* =====================================================
       Remove All Images
    ===================================================== */

    const clearImages = async () => {

        if (!images.length) {

            return;

        }


        const result =
            await Swal.fire({

                icon: "warning",

                title:
                    "ลบรูปภาพทั้งหมด?",

                text:
                    `คุณกำลังจะลบรูปภาพ ${images.length} รูป`,

                showCancelButton: true,

                confirmButtonText:
                    "ลบทั้งหมด",

                cancelButtonText:
                    "ยกเลิก",

                confirmButtonColor:
                    "#006664",

                cancelButtonColor:
                    "#6c757d"

            });


        if (!result.isConfirmed) {

            return;

        }


        setImages([]);


        if (fileInputRef.current) {

            fileInputRef.current.value =
                "";

        }

    };


    /* =====================================================
       Submit
    ===================================================== */

    const handleSubmit = async () => {

        try {

            /* -------------------------------------------
               Validate Activity
            ------------------------------------------- */

            if (!form.activity_id) {

                await Swal.fire({

                    icon: "warning",

                    title:
                        "ยังไม่ได้เลือกกิจกรรม",

                    text:
                        "กรุณาเลือกหัวข้อกิจกรรมก่อน",

                    confirmButtonText:
                        "ตกลง",

                    confirmButtonColor:
                        "#006664"

                });

                return;

            }


            /* -------------------------------------------
               Validate Date
            ------------------------------------------- */

            if (!form.upload_date) {

                await Swal.fire({

                    icon: "warning",

                    title:
                        "ยังไม่ได้เลือกวันที่",

                    text:
                        "กรุณาเลือกวันที่จัดกิจกรรม",

                    confirmButtonText:
                        "ตกลง",

                    confirmButtonColor:
                        "#006664"

                });

                return;

            }


            /* -------------------------------------------
               Validate Start Time
            ------------------------------------------- */

            if (!form.upload_time) {

                await Swal.fire({

                    icon: "warning",

                    title:
                        "ยังไม่ได้เลือกเวลาเริ่ม",

                    text:
                        "กรุณาเลือกเวลาเริ่มต้น",

                    confirmButtonText:
                        "ตกลง",

                    confirmButtonColor:
                        "#006664"

                });

                return;

            }


            /* -------------------------------------------
               Validate End Time
            ------------------------------------------- */

            if (!form.end_time) {

                await Swal.fire({

                    icon: "warning",

                    title:
                        "ยังไม่ได้เลือกเวลาสิ้นสุด",

                    text:
                        "กรุณาเลือกเวลาสิ้นสุด",

                    confirmButtonText:
                        "ตกลง",

                    confirmButtonColor:
                        "#006664"

                });

                return;

            }


            /* -------------------------------------------
               Validate Time
            ------------------------------------------- */

            if (
                form.upload_time &&
                form.end_time &&
                form.end_time < form.upload_time
            ) {

                await Swal.fire({

                    icon: "warning",

                    title:
                        "เวลาไม่ถูกต้อง",

                    text:
                        "เวลาสิ้นสุดต้องไม่ก่อนเวลาเริ่มต้น",

                    confirmButtonText:
                        "ตกลง",

                    confirmButtonColor:
                        "#006664"

                });

                return;

            }


            /* -------------------------------------------
               Validate Images
            ------------------------------------------- */

            if (!images.length) {

                await Swal.fire({

                    icon: "warning",

                    title:
                        "ยังไม่ได้เลือกรูปภาพ",

                    text:
                        "กรุณาเลือกรูปภาพกิจกรรมอย่างน้อย 1 รูป",

                    confirmButtonText:
                        "ตกลง",

                    confirmButtonColor:
                        "#006664"

                });

                return;

            }


            /* -------------------------------------------
               FormData
            ------------------------------------------- */

            const data =
                new FormData();


            if (userId) {

                data.append(
                    "user_id",
                    userId
                );

            }


            /* หัวข้อกิจกรรม */

            data.append(
                "activity_id",
                form.activity_id
            );


            /* วันที่ */

            data.append(
                "upload_date",
                form.upload_date || ""
            );


            /* เวลาเริ่ม */

            data.append(
                "upload_time",
                form.upload_time || ""
            );


            /* เวลาสิ้นสุด */

            data.append(
                "end_time",
                form.end_time || ""
            );


            /* คำอธิบาย */

            data.append(
                "description",
                form.description || ""
            );


            /* Location */

            data.append(
                "location_id",
                form.location_id || ""
            );


            /* Latitude */

            data.append(
                "latitude",
                form.latitude || "-"
            );


            /* Longitude */

            data.append(
                "longitude",
                form.longitude || "-"
            );


            /* -------------------------------------------
               Images
               เพิ่มได้ต่อเนื่อง
            ------------------------------------------- */

            images.forEach(
                (image) => {

                    data.append(
                        "images",
                        image
                    );

                }
            );


            /* -------------------------------------------
               API
            ------------------------------------------- */

            setLoading(true);


            const res =
                await api.post(

                    "/member/upload",

                    data,

                    {
                        headers: {
                            "Content-Type":
                                "multipart/form-data"
                        }
                    }

                );

            const uploadedActivityId = res.data?.data?.activity_id || form.activity_id;


            if (!res.data?.success) {

                throw new Error(
                    res.data?.message ||
                    "ไม่สามารถบันทึกข้อมูลได้"
                );

            }


            /* -------------------------------------------
               Success
            ------------------------------------------- */

            await Swal.fire({

                icon: "success",

                title: "อัปโหลดสำเร็จ",

                confirmButtonText:
                    "เรียบร้อย",

                confirmButtonColor:
                    "#006664"

            });


            /* -------------------------------------------
               Reset
            ------------------------------------------- */

            setImages([]);

            setForm(
                createDefaultForm()
            );


            if (fileInputRef.current) {

                fileInputRef.current.value =
                    "";

            }

            if (uploadedActivityId) {
                window.location.assign(`/member/gallery/${uploadedActivityId}`);
            }

        } catch (error) {

            console.error(
                "Upload activity error:",
                error
            );


            await Swal.fire({

                icon: "error",

                title:
                    "อัปโหลดไม่สำเร็จ",

                text:
                    error.response?.data?.message ||
                    error.message ||
                    "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",

                confirmButtonText:
                    "ตกลง",

                confirmButtonColor:
                    "#006664"

            });

        } finally {

            setLoading(false);

        }

    };


    /* =====================================================
       Render
    ===================================================== */

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (

        <div
            className="container-fluid py-4"
        >

            {/* =================================================
                Header
            ================================================= */}

            {/* =================================================
                Activity Information
            ================================================= */}

            <div
                className="
                    card
                    border-0
                    shadow-sm
                    rounded-4
                    mb-4
                "
            >

                <div
                    className="card-body p-4 p-lg-5"
                >

                    {/* =================================================
                        Title
                    ================================================= */}

                    <h3
                        className="fw-bold mb-4"
                        style={{
                            fontSize: 26,
                            color: "#111827"
                        }}
                    >
                        ข้อมูลกิจกรรม
                    </h3>


                    {/* =================================================
                        Activity Topic
                    ================================================= */}

                    <div className="mb-4">

                        <label
                            className="form-label fw-bold mb-2"
                            style={{
                                fontSize: 17
                            }}
                        >

                            <FaFolderOpen
                                className="me-2"
                                style={{
                                    color: "#006664"
                                }}
                            />

                            หัวข้อกิจกรรม{" "}

                            <span
                                className="text-danger"
                            >
                                *
                            </span>

                        </label>


                        <div style={{ position: "relative" }}>
                            <select
                                className="
                                    form-select
                                    form-select-lg
                                "
                                value={
                                    form.activity_id
                                }
                                onChange={(e) => {
                                    handleActivityChange(e);
                                    setActivityDropdownOpen(false);
                                }}
                                onFocus={() => setActivityDropdownOpen(true)}
                                onBlur={() => setActivityDropdownOpen(false)}
                                disabled={
                                    loadingActivities ||
                                    loading ||
                                    gettingLocation
                                }
                                style={{
                                    borderRadius: 14,
                                    minHeight: 58,
                                    fontSize: 18,
                                    background: "#fff",
                                    paddingRight: "2.8rem",
                                    paddingLeft: "1rem",
                                    appearance: "none",
                                    WebkitAppearance: "none",
                                    MozAppearance: "none"
                                }}
                            >

                            <option value="">

                                {
                                    loadingActivities
                                        ? "กำลังโหลดกิจกรรม..."
                                        : "เลือกกิจกรรม"
                                }

                            </option>


                                {activities.map(
                                    (activity) => (

                                        <option
                                            key={
                                                activity.activity_id
                                            }
                                            value={
                                                activity.activity_id
                                            }
                                        >

                                            {
                                                activity.activity_name
                                            }

                                        </option>

                                    )
                                )}

                            </select>

                            <span
                                style={{
                                    position: "absolute",
                                    right: "1rem",
                                    top: "50%",
                                    transform: `translateY(-50%) rotate(${activityDropdownOpen ? "180deg" : "0deg"})`,
                                    transition: "transform 0.2s ease",
                                    pointerEvents: "none",
                                    color: "#006664",
                                    fontSize: 30,
                                    lineHeight: 1
                                }}
                                aria-hidden="true"
                            >
                                ▾
                            </span>
                        </div>

                    </div>


                    {/* =================================================
                        Date + Time
                        
                        จุดสำคัญ:
                        label วันที่ และ label เวลา อยู่ระดับเดียวกัน
                        input วันที่กับชุดเวลาเริ่มที่แนวเดียวกัน
                    ================================================= */}

                    <div
                        className="
                            row
                            g-4
                            align-items-start
                        "
                    >

                        {/* =================================================
                            Date
                        ================================================= */}

                        <div
                            className="col-lg-6"
                        >

                            <label
                                className="form-label fw-bold"
                                style={sharedFieldLabelStyle}
                            >

                                <FaCalendarAlt
                                    className="me-2"
                                    style={{
                                        color: "#006664"
                                    }}
                                />

                                วันที่{" "}

                                <span
                                    className="text-danger"
                                >
                                    *
                                </span>

                            </label>


                            <div
                                className="position-relative"
                            >
                                <label
                                    className="
                                        form-label
                                        mb-2
                                    "
                                    style={{
                                        display:
                                            "block",
                                        height:
                                            22,
                                        lineHeight:
                                            "22px",
                                        fontSize:
                                            15,
                                        fontWeight:
                                            500,
                                        color:
                                            "#64748B"
                                    }}
                                >
                                    วันที่จัดกิจกรรม
                                </label>

                                <input
                                    type="date"
                                    name="upload_date"
                                    className="
                                        form-control
                                        form-control-lg
                                    "
                                    value={
                                        form.upload_date
                                    }
                                    onChange={
                                        handleInputChange
                                    }
                                    disabled={
                                        activitySelectionOnly ||
                                        !form.activity_id ||
                                        loading
                                    }
                                    style={{
                                        ...sharedFieldInputStyle,
                                        background:
                                            form.activity_id
                                                ? "#fff"
                                                : "#F8FAFC"
                                    }}
                                />
                            </div>

                        </div>


                        {/* =================================================
                            Time
                        ================================================= */}

                        <div
                            className="col-lg-6"
                        >

                            {/* Time Label */}

                            <label
                                className="form-label fw-bold"
                                style={sharedFieldLabelStyle}
                            >

                                <FaClock
                                    className="me-2"
                                    style={{
                                        color: "#006664"
                                    }}
                                />

                                เวลา{" "}

                                <span
                                    className="text-danger"
                                >
                                    *
                                </span>

                            </label>


                            {/* Start + End */}

                            <div
                                className="row"
                                style={{
                                    marginLeft: 0,
                                    marginRight: 0
                                }}
                            >

                                {/* Start */}

                                <div
                                    className="col-6"
                                    style={{
                                        paddingLeft: 0,
                                        paddingRight: 8
                                    }}
                                >

                                    <label
                                        className="
                                            form-label
                                            mb-2
                                        "
                                        style={{
                                            display:
                                                "block",
                                            height:
                                                22,
                                            lineHeight:
                                                "22px",
                                            fontSize:
                                                15,
                                            fontWeight:
                                                500,
                                            color:
                                                "#64748B"
                                        }}
                                    >
                                        เริ่มต้น
                                    </label>


                                    <input
                                        type="time"
                                        name="upload_time"
                                        className="
                                            form-control
                                            form-control-lg
                                        "
                                        value={
                                            form.upload_time
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        disabled={
                                            activitySelectionOnly ||
                                            !form.activity_id ||
                                            loading
                                        }
                                        style={{
                                            ...sharedFieldInputStyle,
                                            background:
                                                form.activity_id
                                                    ? "#fff"
                                                    : "#F8FAFC"
                                        }}
                                    />

                                </div>


                                {/* End */}

                                <div
                                    className="col-6"
                                    style={{
                                        paddingLeft: 8,
                                        paddingRight: 0
                                    }}
                                >

                                    <label
                                        className="
                                            form-label
                                            mb-2
                                        "
                                        style={{
                                            display:
                                                "block",
                                            height:
                                                22,
                                            lineHeight:
                                                "22px",
                                            fontSize:
                                                15,
                                            fontWeight:
                                                500,
                                            color:
                                                "#64748B"
                                        }}
                                    >
                                        สิ้นสุด
                                    </label>


                                    <input
                                        type="time"
                                        name="end_time"
                                        className="
                                            form-control
                                            form-control-lg
                                        "
                                        value={
                                            form.end_time
                                        }
                                        onChange={
                                            handleInputChange
                                        }
                                        disabled={
                                            activitySelectionOnly ||
                                            !form.activity_id ||
                                            loading
                                        }
                                        style={{
                                            ...sharedFieldInputStyle,
                                            background:
                                                form.activity_id
                                                    ? "#fff"
                                                    : "#F8FAFC"
                                        }}
                                    />

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        Description
                    ================================================= */}

                    <div
                        className="mt-4"
                    >

                        <label
                            className="
                                form-label
                                fw-bold
                                mb-2
                            "
                            style={{
                                fontSize: 17
                            }}
                        >
                            คำอธิบาย
                        </label>


                        <textarea
                            name="description"
                            className="
                                form-control
                            "
                            rows={5}
                            value={
                                form.description
                            }
                            onChange={
                                handleInputChange
                            }
                            disabled={
                                activitySelectionOnly ||
                                !form.activity_id ||
                                loading
                            }
                            placeholder={
                                activitySelectionOnly
                                    ? "ข้อมูลกิจกรรมถูกปิดการแก้ไข"
                                    : form.activity_id
                                        ? "แก้ไขคำอธิบายกิจกรรมได้"
                                        : "กรุณาเลือกกิจกรรมก่อน"
                            }
                            style={{
                                borderRadius: 14,
                                resize: "vertical",
                                fontSize: 17,
                                border:
                                    "1px solid #D9DEE7",
                                background:
                                    form.activity_id
                                        ? "#fff"
                                        : "#F8FAFC"
                            }}
                        />

                    </div>


                    {/* =================================================
                        Location
                    ================================================= */}

                    <div
                        className="mt-4"
                    >

                        <label
                            className="
                                form-label
                                fw-bold
                                mb-2
                            "
                            style={{
                                fontSize: 17
                            }}
                        >

                            <FaMapMarkerAlt
                                className="me-2"
                                style={{
                                    color: "#006664"
                                }}
                            />

                            ตำแหน่งกิจกรรม

                        </label>


                        {/* Location Select */}

                        <select
                            className="
                                form-select
                                form-select-lg
                                mb-3
                            "
                            value={
                                form.location_id
                            }
                            onChange={
                                handleLocationChange
                            }
                            disabled={
                                activitySelectionOnly ||
                                !form.activity_id ||
                                loadingLocations ||
                                loading
                            }
                            style={{
                                borderRadius: 14,
                                minHeight: 58,
                                fontSize: 17,
                                background:
                                    form.activity_id
                                        ? "#fff"
                                        : "#F8FAFC"
                            }}
                        >

                            <option value="">

                                {
                                    loadingLocations
                                        ? "กำลังโหลดสถานที่..."
                                        : "เลือกตำแหน่ง"
                                }

                            </option>


                            {locations.map(
                                (location) => (

                                    <option
                                        key={
                                            location.location_id
                                        }
                                        value={
                                            location.location_id
                                        }
                                    >

                                        {
                                            location.location_name
                                        }

                                    </option>

                                )
                            )}

                        </select>

                        <div
                            className="
                                d-flex
                                align-items-center
                                flex-wrap
                                gap-3
                                mb-3
                            "
                        >

                            <button
                                type="button"
                                className="btn btn-outline-success"
                                onClick={handleGetCurrentLocation}
                                disabled={
                                    !form.activity_id ||
                                    loading ||
                                    gettingLocation
                                }
                            >
                                <FaMapMarkerAlt className="me-2" />
                                {
                                    gettingLocation
                                        ? "กำลังค้นหาตำแหน่ง..."
                                        : "ใช้ตำแหน่งปัจจุบัน"
                                }
                            </button>

                            {locationStatus && (
                                <span
                                    className={
                                        locationError
                                            ? "text-danger"
                                            : "text-success"
                                    }
                                    role="status"
                                    aria-live="polite"
                                >
                                    {locationStatus}
                                </span>
                            )}

                            {!locationStatus && (
                                <small className="text-muted">
                                    ต้องอนุญาตตำแหน่งในเบราว์เซอร์ และเปิดเว็บไซต์ผ่าน HTTPS หรือ localhost
                                </small>
                            )}

                        </div>


                        {/* Latitude + Longitude */}

                        <div
                            className="row g-3"
                        >

                            {/* Latitude */}

                            <div
                                className="col-md-6"
                            >

                                <label
                                    className="
                                        form-label
                                        fw-semibold
                                    "
                                >
                                    ละติจูด (Latitude)
                                </label>


                                <input
                                    type="text"
                                    className="
                                        form-control
                                        form-control-lg
                                    "
                                    value={
                                        form.latitude ||
                                        "-"
                                    }
                                    onChange={
                                        (e) =>
                                            setForm(
                                                (prev) => ({
                                                    ...prev,
                                                    latitude:
                                                        e.target.value
                                                })
                                            )
                                    }
                                    disabled={
                                        activitySelectionOnly ||
                                        !form.activity_id ||
                                        loading
                                    }
                                    style={{
                                        minHeight: 58,
                                        borderRadius: 14,
                                        fontSize: 17,
                                        background:
                                            form.activity_id
                                                ? "#fff"
                                                : "#F8FAFC"
                                    }}
                                />

                            </div>


                            {/* Longitude */}

                            <div
                                className="col-md-6"
                            >

                                <label
                                    className="
                                        form-label
                                        fw-semibold
                                    "
                                >
                                    ลองจิจูด (Longitude)
                                </label>


                                <input
                                    type="text"
                                    className="
                                        form-control
                                        form-control-lg
                                    "
                                    value={
                                        form.longitude ||
                                        "-"
                                    }
                                    onChange={
                                        (e) =>
                                            setForm(
                                                (prev) => ({
                                                    ...prev,
                                                    longitude:
                                                        e.target.value
                                                })
                                            )
                                    }
                                    disabled={
                                        activitySelectionOnly ||
                                        !form.activity_id ||
                                        loading
                                    }
                                    style={{
                                        minHeight: 58,
                                        borderRadius: 14,
                                        fontSize: 17,
                                        background:
                                            form.activity_id
                                                ? "#fff"
                                                : "#F8FAFC"
                                    }}
                                />

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                Images
            ================================================= */}

            <div
                className="
                    card
                    border-0
                    shadow-sm
                    rounded-4
                    mb-4
                "
            >

                <div
                    className="card-body p-4 p-lg-5"
                >

                    {/* Header */}

                    <div
                        className="
                            d-flex
                            justify-content-between
                            align-items-center
                            mb-4
                            gap-3
                        "
                    >

                        <div>

                            <h3
                                className="
                                    fw-bold
                                    mb-1
                                "
                                style={{
                                    fontSize: 25
                                }}
                            >

                                <FaImages
                                    className="me-2"
                                    style={{
                                        color: "#006664"
                                    }}
                                />

                                รูปกิจกรรม

                            </h3>

                            <div
                                style={{
                                    color: "#64748B",
                                    fontSize: 15
                                }}
                            >
                                เพิ่มรูปภาพได้ต่อเนื่อง
                            </div>

                        </div>


                        {/* Counter + Clear */}

                        <div
                            className="
                                d-flex
                                align-items-center
                                gap-2
                            "
                        >

                            <span
                                style={{
                                    background:
                                        "#E9F7F0",
                                    color:
                                        "#006664",
                                    borderRadius:
                                        999,
                                    padding:
                                        "9px 16px",
                                    fontWeight:
                                        700,
                                    whiteSpace:
                                        "nowrap"
                                }}
                            >
                                {images.length} รูป
                            </span>


                            <button
                                type="button"
                                onClick={
                                    clearImages
                                }
                                disabled={
                                    !images.length ||
                                    loading
                                }
                                style={{
                                    border:
                                        "1px solid #006664",
                                    background:
                                        "#fff",
                                    color:
                                        "#006664",
                                    borderRadius:
                                        12,
                                    padding:
                                        "9px 16px",
                                    fontWeight:
                                        700,
                                    cursor:
                                        images.length
                                            ? "pointer"
                                            : "default",
                                    whiteSpace:
                                        "nowrap",
                                    opacity:
                                        images.length
                                            ? 1
                                            : 0.5
                                }}
                            >
                                ลบรูปทั้งหมด
                            </button>

                        </div>

                    </div>


                    {/* =================================================
                        Upload Box
                    ================================================= */}

                    <div
                        style={{
                            padding: 0,
                            minHeight: 0
                        }}
                    >

                        {/* Hidden File Input */}

                        <input
                            ref={
                                fileInputRef
                            }
                            type="file"
                            accept="
                                image/jpeg,
                                image/jpg,
                                image/png,
                                image/webp
                            "
                            multiple
                            onChange={
                                handleImageChange
                            }
                            style={{
                                display:
                                    "none"
                            }}
                        />


                        {/* =================================================
                            Images
                        ================================================= */}

                        {images.length > 0 ? (

                            <div
                                style={{
                                    display:
                                        "grid",
                                    gridTemplateColumns:
                                        "repeat(auto-fill, minmax(190px, 1fr))",
                                    gap: 20
                                }}
                            >

                                {imagePreviews.map(
                                    (
                                        preview,
                                        index
                                    ) => (

                                        <div
                                            key={
                                                `${preview.file.name}-${index}`
                                            }
                                            style={{
                                                position:
                                                    "relative",
                                                aspectRatio:
                                                    "1 / 1",
                                                borderRadius:
                                                    18,
                                                overflow:
                                                    "hidden",
                                                background:
                                                    "#fff",
                                                boxShadow:
                                                    "0 8px 25px rgba(0,0,0,.08)"
                                            }}
                                        >

                                            <img
                                                src={
                                                    preview.url
                                                }
                                                alt=""
                                                style={{
                                                    width:
                                                        "100%",
                                                    height:
                                                        "100%",
                                                    objectFit:
                                                        "cover",
                                                    display:
                                                        "block"
                                                }}
                                            />


                                            {/* X */}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeImage(
                                                        index
                                                    )
                                                }
                                                disabled={
                                                    loading
                                                }
                                                title="ลบรูป"
                                                style={{
                                                    position:
                                                        "absolute",
                                                    top:
                                                        10,
                                                    right:
                                                        10,
                                                    width:
                                                        42,
                                                    height:
                                                        42,
                                                    borderRadius:
                                                        "50%",
                                                    border:
                                                        "2px solid rgba(255,255,255,.95)",
                                                    background:
                                                        "rgba(220,53,69,.92)",
                                                    color:
                                                        "#fff",
                                                    display:
                                                        "flex",
                                                    alignItems:
                                                        "center",
                                                    justifyContent:
                                                        "center",
                                                    fontSize:
                                                        18,
                                                    cursor:
                                                        "pointer",
                                                    boxShadow:
                                                        "0 4px 12px rgba(0,0,0,.2)"
                                                }}
                                            >

                                                <FaTimes />

                                            </button>

                                        </div>

                                    )
                                )}

                                <div
                                    className="member-photo-upload-trigger member-activity-add-tile"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => fileInputRef.current?.click()}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            fileInputRef.current?.click();
                                        }
                                    }}
                                >

                                    <span className="activity-add-image-plus">
                                        <FaPlus />
                                    </span>

                                </div>

                            </div>

                        ) : (

                            /* =================================================
                               Empty State
                            ================================================= */

                            <div className="member-photo-upload-trigger">

                                <div className="member-photo-upload-icon">

                                    <FaCloudUploadAlt />

                                </div>


                                <div className="fs-5">
                                    เลือกรูปภาพ
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    disabled={
                                        loading ||
                                        !form.activity_id
                                    }
                                    className="member-upload-btn border-0"
                                >

                                    <FaImages
                                        className="me-2"
                                    />

                                    เพิ่มรูปภาพ

                                </button>

                            </div>

                        )}


                    </div>

                    <div className="mt-4">

                        <button
                            type="button"
                            className="member-upload-btn border-0 w-100"
                            onClick={handleSubmit}
                            disabled={
                                loading ||
                                !form.activity_id ||
                                images.length === 0
                            }
                            style={{
                                minHeight: 68,
                                fontSize: 21
                            }}
                        >

                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    กำลังอัปโหลด...
                                </>
                            ) : (
                                <>
                                    <FaCloudUploadAlt className="me-2" />
                                    อัปโหลดกิจกรรม ({images.length} รูป)
                                </>
                            )}

                        </button>

                    </div>

                </div>

            </div>


        </div>

    );

}


export default UploadActivity;
