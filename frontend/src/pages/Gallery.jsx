// จุดประสงค์: ค้นหาและแสดงรายการอัลบั้มสาธารณะพร้อมตัวกรองวันและเวลา
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaCalendarAlt, FaClock, FaImages, FaMapMarkerAlt, FaSearch, FaTimes } from "react-icons/fa";
import api from "../services/api";

const Gallery = () => {

    // 1. สถานะของหน้าแกลเลอรี
    //    - albums เก็บรายการอัลบั้มที่ได้รับจาก API
    //    - loading ใช้ควบคุมการแสดงตัวหมุนระหว่างรอข้อมูล
    //    - search เก็บคำค้นหาที่ใช้กรองอัลบั้มบนหน้าเว็บ
    //    - startDate/endDate และ startTime/endTime เก็บช่วงวันที่และเวลาสำหรับค้นหาจาก API
    //    - dateError เก็บข้อความแจ้งเตือนเมื่อโหลดหรือค้นหาข้อมูลไม่สำเร็จ
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [dateError, setDateError] = useState("");

    // 2. โหลดรายการอัลบั้มจาก API
    //    - รับตัวกรองวันที่และเวลา (ถ้ามี) แล้วแปลงชื่อพารามิเตอร์ให้ตรงกับ API
    //    - เปิดสถานะกำลังโหลดและล้างข้อความผิดพลาดเก่าก่อนเริ่มคำขอ
    //    - บันทึกรายการอัลบั้มเมื่อสำเร็จ หรือแสดงข้อความแจ้งเตือนเมื่อเกิดข้อผิดพลาด
    //    - ปิดสถานะกำลังโหลดเสมอหลังคำขอสิ้นสุด
    const loadGallery = async (filters = {}) => {
        try {
            setLoading(true);
            setDateError("");
            const res = await api.get("/gallery", {
                params: {
                    ...(filters.startDate ? { start_date: filters.startDate } : {}),
                    ...(filters.endDate ? { end_date: filters.endDate } : {}),
                    ...(filters.startTime ? { start_time: filters.startTime } : {}),
                    ...(filters.endTime ? { end_time: filters.endTime } : {}),
                }
            });
            setAlbums(res.data.data || []);
        } catch (err) {
            console.error(err);
            setDateError(err.response?.data?.message || "ค้นหากิจกรรมไม่สำเร็จ กรุณาลองใหม่");
        } finally {
            setLoading(false);
        }
    };

    // 3. โหลดอัลบั้มครั้งแรกเมื่อเปิดหน้า
    //    - เรียก API โดยไม่ส่งตัวกรอง เพื่อแสดงอัลบั้มทั้งหมด
    //    - อัปเดตสถานะเฉพาะเมื่อคอมโพเนนต์ยังอยู่บนหน้า ป้องกันการอัปเดตหลังออกจากหน้า
    //    - จัดการข้อผิดพลาดและปิดสถานะกำลังโหลดเมื่อคำขอเสร็จสิ้น
    useEffect(() => {
        let active = true;

        api.get("/gallery")
            .then((res) => {
                if (active) {
                    setAlbums(res.data.data || []);
                }
            })
            .catch((err) => {
                console.error(err);
                if (active) {
                    setDateError("โหลดอัลบั้มไม่สำเร็จ กรุณาลองใหม่");
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    // 4. ตรวจสอบและใช้ตัวกรองวันที่/เวลา
    //    - ป้องกันฟอร์มส่งข้อมูลแล้วรีเฟรชหน้าเว็บ
    //    - ตรวจว่าค่าวันเริ่มต้นไม่อยู่หลังวันสิ้นสุด และเวลาเริ่มต้นไม่อยู่หลังเวลาสิ้นสุด
    //    - หากข้อมูลถูกต้อง ให้โหลดอัลบั้มใหม่ตามช่วงที่ผู้ใช้เลือก
    const applyDateFilter = (event) => {
        event.preventDefault();
        if (startDate && endDate && startDate > endDate) {
            setDateError("วันเริ่มต้นต้องไม่อยู่หลังวันสิ้นสุด");
            return;
        }
        if (startTime && endTime && startTime > endTime) {
            setDateError("เวลาเริ่มต้นต้องไม่อยู่หลังเวลาสิ้นสุด");
            return;
        }
        loadGallery({ startDate, endDate, startTime, endTime });
    };

    // 5. ล้างคำค้นหาและตัวกรองทั้งหมด
    //    - รีเซ็ตค่าช่องค้นหา วันที่ และเวลา
    //    - โหลดรายการอัลบั้มทั้งหมดกลับมาใหม่
    const clearFilters = () => {
        setSearch("");
        setStartDate("");
        setEndDate("");
        setStartTime("");
        setEndTime("");
        loadGallery();
    };

    // 6. จัดรูปแบบวันที่สำหรับแสดงผลและใช้ค้นหา
    //    - คืนเครื่องหมาย "-" เมื่อไม่มีวันที่
    //    - แปลงวันที่เป็นรูปแบบภาษาไทย โดยแสดงวัน ชื่อเดือน และปี
    const formatDate = (date) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("th-TH", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    };

    // 7. กรองอัลบั้มด้วยคำค้นหาบนหน้าเว็บ
    //    - ตัดช่องว่างหัวท้ายและแปลงข้อความเป็นตัวพิมพ์เล็กก่อนเปรียบเทียบ
    //    - ค้นหาได้จากชื่อกิจกรรม สถานที่ วันที่ภาษาไทย และช่วงเวลากิจกรรม
    //    - กรองจาก albums ที่โหลดไว้ โดยไม่เรียก API ซ้ำเมื่อพิมพ์คำค้นหา
    const filteredAlbums = albums.filter((album) => {
        const keyword = search.trim().toLocaleLowerCase();
        const thaiDate = formatDate(album.activity_date).toLowerCase();
        const location = (album.location_name || "").toLowerCase();
        const activity = (album.activity_name || "").toLowerCase();
        const activityTime = [
            album.start_time,
            album.end_time
        ]
            .filter(Boolean)
            .map((time) => String(time).substring(0, 5))
            .join(" - ")
            .toLowerCase();

        return (
            activity.includes(keyword) ||
            location.includes(keyword) ||
            thaiDate.includes(keyword) ||
            activityTime.includes(keyword)
        );
    });

    // 8. หน้าจอระหว่างโหลดข้อมูล
    //    แสดงตัวหมุนและข้อความ เพื่อแจ้งให้ผู้ใช้ทราบว่าระบบกำลังดึงรายการอัลบั้ม
    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-success"></div>
                <p className="mt-3">กำลังโหลดอัลบั้ม...</p>
            </div>
        );
    }

    return (
        <div
            className="container py-5"
            style={{
                background: "#f8fafc",
                minHeight: "100vh"
            }}
        >
            {/* 9. ส่วนหัวของหน้า: ระบุว่าหน้านี้รวมอัลบั้มกิจกรรมและใช้เรียกดูภาพย้อนหลัง */}
            <div className="text-center mb-4">
                <h1 className="fw-bold mb-3" style={{ fontSize: "2.5rem", color: "#006664" }}>
                    อัลบั้มกิจกรรมทั้งหมด
                </h1>
                <p className="text-muted mb-4" style={{ fontSize: "1rem" }}>
                    ค้นหาและเรียกดูภาพกิจกรรมย้อนหลัง
                </p>
            </div>

            {/* 10. ฟอร์มค้นหาและตัวกรอง
                - ช่องค้นหากรองชื่อกิจกรรม สถานที่ วันที่ หรือเวลาแบบทันที
                - ช่องวันที่และเวลาใช้กำหนดช่วงค้นหาที่ส่งไปยัง API
                - ปุ่มค้นหาใช้ตรวจสอบและส่งตัวกรอง ส่วนปุ่มล้างคืนค่าเป็นรายการทั้งหมด
                - แสดงข้อความเตือนเมื่อช่วงวันที่/เวลาผิดลำดับหรือเรียกข้อมูลไม่สำเร็จ
            */}
            <form className="row justify-content-center g-3 mb-5" onSubmit={applyDateFilter}>
                <div className="col-12">
                    <div className="gallery-search-input-wrap">
                        <FaSearch className="gallery-search-input-icon" aria-hidden="true" />
                        <input
                            id="gallery-search"
                            type="search"
                            className="gallery-search-input"
                            aria-label="ค้นหากิจกรรม"
                            placeholder="ค้นหากิจกรรม..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                        {search && (
                            <button
                                type="button"
                                className="gallery-search-clear"
                                aria-label="ล้างคำค้นหา"
                                onClick={() => setSearch("")}
                            >
                                <FaTimes aria-hidden="true" />
                            </button>
                        )}
                    </div>
                </div>
                <div className="col-12 col-md-4 col-xl-3">
                    <label htmlFor="gallery-start-date" className="form-label fw-semibold">ตั้งแต่วันที่</label>
                    <input
                        id="gallery-start-date"
                        type="date"
                        className="form-control"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                    />
                </div>
                <div className="col-12 col-md-4 col-xl-3">
                    <label htmlFor="gallery-end-date" className="form-label fw-semibold">ถึงวันที่</label>
                    <input
                        id="gallery-end-date"
                        type="date"
                        className="form-control"
                        value={endDate}
                        min={startDate || undefined}
                        onChange={(event) => setEndDate(event.target.value)}
                    />
                </div>
                <div className="col-12 col-md-4 col-xl-2">
                    <label htmlFor="gallery-start-time" className="form-label fw-semibold">ตั้งแต่เวลา</label>
                    <input
                        id="gallery-start-time"
                        type="time"
                        className="form-control"
                        value={startTime}
                        onChange={(event) => setStartTime(event.target.value)}
                    />
                </div>
                <div className="col-12 col-md-4 col-xl-2">
                    <label htmlFor="gallery-end-time" className="form-label fw-semibold">ถึงเวลา</label>
                    <input
                        id="gallery-end-time"
                        type="time"
                        className="form-control"
                        value={endTime}
                        min={startTime || undefined}
                        onChange={(event) => setEndTime(event.target.value)}
                    />
                </div>
                <div className="col-12 col-md-auto d-flex align-items-end gap-2">
                    <button type="submit" className="btn btn-success px-4">ค้นหา</button>
                    <button type="button" className="btn btn-outline-secondary px-4" onClick={clearFilters}>ล้างตัวกรอง</button>
                </div>
                {dateError && (
                    <div className="col-12 col-xl-8">
                        <div className="alert alert-warning mb-0" role="alert">{dateError}</div>
                    </div>
                )}
            </form>

            {/* 11. ผลการค้นหา
                - แสดงข้อความกรณีไม่มีอัลบั้มที่ตรงกับคำค้นหาหรือตัวกรอง
                - หากพบข้อมูล วนสร้างการ์ดอัลบั้มและลิงก์ไปยังหน้ารายละเอียดของกิจกรรมนั้น
            */}
            {filteredAlbums.length === 0 ? (
                <div className="text-center py-5">
                    <h4 className="fw-bold">ไม่พบอัลบั้ม</h4>
                    <p className="text-muted">กรุณาลองค้นหาด้วยคำอื่น</p>
                </div>
            ) : (
                <div className="row g-4">
                    {filteredAlbums.map((album) => (
                        <div className="col-xl-3 col-lg-4 col-md-6" key={album.activity_id}>
                            <Link
                                to={`/gallery/${album.activity_id}`}
                                style={{ textDecoration: "none", color: "inherit" }}
                            >
                                {/* เอฟเฟกต์ hover ยกการ์ดขึ้นเมื่อชี้เมาส์ เพื่อสื่อว่าการ์ดกดเข้าดูต่อได้ */}
                                <div
                                    className="card h-100 border-0 shadow-lg"
                                    style={{
                                        borderRadius: "24px",
                                        overflow: "hidden",
                                        transition: ".35s",
                                        background: "#fff"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-8px)";
                                        e.currentTarget.style.boxShadow = "0 18px 40px rgba(0,0,0,.12)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "0 1rem 2rem rgba(0,0,0,.08)";
                                    }}
                                >
                                    {/* 11.1 ภาพปกอัลบั้ม
                                        แสดงภาพปกจากเซิร์ฟเวอร์ หากไม่มีภาพหรือโหลดภาพไม่สำเร็จจะแสดงไอคอนแทน
                                    */}
                                    <div style={{ height: "260px", overflow: "hidden" }}>
                                        {album.cover_image ? (
                                            <img
                                                src={`http://localhost:5000${album.cover_image}`}
                                                alt={album.activity_name}
                                                onError={(event) => {
                                                    event.currentTarget.style.display = "none";
                                                    event.currentTarget.nextElementSibling.style.display = "flex";
                                                }}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    transition: ".5s"
                                                }}
                                            />
                                        ) : null}

                                        <div
                                            style={{
                                                display: album.cover_image ? "none" : "flex",
                                                width: "100%",
                                                height: "100%",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                background: "#f1f5f3",
                                                color: "#006664",
                                                fontSize: "56px"
                                            }}
                                        >
                                            <FaImages />
                                        </div>
                                    </div>

                                    {/* 11.2 รายละเอียดในการ์ด
                                        แสดงชื่อกิจกรรม วันที่ เวลา สถานที่ และจำนวนรูปภาพในอัลบั้ม
                                    */}
                                    <div
                                        className="card-body d-flex flex-column"
                                        style={{
                                            rowGap: "0.7rem",
                                            padding: "1.25rem 1.25rem 1.1rem",
                                            width: "100%"
                                        }}
                                    >
                                        <h4
                                            className="fw-bold"
                                            style={{
                                                minHeight: "76px",
                                                lineHeight: 1.45,
                                                fontSize: "1.35rem",
                                                letterSpacing: "0.01em",
                                                color: "#006664",
                                                margin: 0,
                                                width: "100%",
                                                display: "flex",
                                                alignItems: "center"
                                            }}
                                        >
                                            {album.activity_name}
                                        </h4>

                                        <div
                                            style={{
                                                color: "#006664",
                                                fontSize: "0.92rem",
                                                fontWeight: 700,
                                                lineHeight: 1.5,
                                                letterSpacing: "0.01em",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.55rem"
                                            }}
                                        >
                                            <FaCalendarAlt style={{ fontSize: "0.9rem" }} />
                                            <span>{formatDate(album.activity_date)}</span>
                                        </div>

                                        <div
                                            style={{
                                                color: "#006664",
                                                fontSize: "0.9rem",
                                                fontWeight: 600,
                                                lineHeight: 1.5,
                                                letterSpacing: "0.01em",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.55rem"
                                            }}
                                        >
                                            <FaClock style={{ fontSize: "0.9rem" }} />
                                            <span>
                                                {album.start_time && album.end_time
                                                    ? `${album.start_time.substring(0, 5)} - ${album.end_time.substring(0, 5)} น.`
                                                    : "เวลาไม่ระบุ"}
                                            </span>
                                        </div>

                                        <p
                                            style={{
                                                minHeight: "24px",
                                                lineHeight: 1.5,
                                                margin: 0,
                                                color: "#006664",
                                                width: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.55rem",
                                                fontSize: "0.96rem",
                                                fontWeight: 600
                                            }}
                                        >
                                            <FaMapMarkerAlt style={{ fontSize: "0.9rem" }} />
                                            <span>{album.location_name || "-"}</span>
                                        </p>

                                        <div
                                            className="d-flex justify-content-between align-items-center"
                                            style={{ marginTop: "0.25rem" }}
                                        >
                                            <span
                                                className="badge rounded-pill px-3 py-2"
                                                style={{
                                                    backgroundColor: "#006664",
                                                    color: "#fff",
                                                    fontWeight: 600,
                                                    fontSize: "0.82rem"
                                                }}
                                            >
                                                {album.total_images || 0} รูป
                                            </span>

                                            <span
                                                className="fw-semibold"
                                                style={{
                                                    color: "#006664",
                                                    fontSize: "0.95rem"
                                                }}
                                            >
                                                ดูอัลบั้ม →
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Gallery;
