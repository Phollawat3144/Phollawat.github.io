// จุดประสงค์: โหลดและแสดงรายละเอียดอัลบั้มและภาพกิจกรรม
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../services/api";
import ImageModal from "../components/gallery/ImageModal";
import ActivityPhotoMap from "../components/map/ActivityPhotoMap";

const GalleryDetail = () => {

    const { id } = useParams();

    // สถานะและข้อมูลที่คอมโพเนนต์ใช้

    const [album, setAlbum] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isOwnerOrAdmin, setIsOwnerOrAdmin] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์

    useEffect(() => {
        const userJson = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (userJson) {
            const u = JSON.parse(userJson);
            setUser(u);
            setIsOwnerOrAdmin(u?.role === 'admin' || u?.user_id === album?.member_id || u?.member_id === album?.member_id || u?.admin_id === album?.admin_id);
        }
    }, []);

    useEffect(() => {
        loadAlbum();
    }, [id]);

    const loadAlbum = async () => {

        try {

            const res = await api.get(`/gallery/${id}`);

            setAlbum(res.data.data);

        }

        catch (err) {

            console.error(err);

        }

        finally {

            setLoading(false);

        }

    };

    const formatDate = (date) => {

        if (!date) return "-";

        return new Date(date).toLocaleDateString("th-TH", {

            day: "numeric",

            month: "long",

            year: "numeric"

        });

    };

    const formatTime = (time) => {
        if (!time) return "เวลาไม่ระบุ";
        return time.substring(0, 5);
    };

    const downloadAlbum = async () => {

        if (!album?.images?.length) {
            Swal.fire({
                icon: "info",
                title: "ยังไม่มีภาพ",
                text: "อัลบั้มนี้ยังไม่มีภาพให้ดาวน์โหลด"
            });
            return;
        }

        try {
            const response = await api.get(
                `/gallery/${id}/download`,
                { responseType: "blob" }
            );
            const url = URL.createObjectURL(response.data);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${album.activity_name}.zip`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "ดาวน์โหลดไม่สำเร็จ",
                text: "ไม่สามารถดาวน์โหลดอัลบั้มนี้ได้"
            });
        }
    };


    if (loading) {

        return (

            <div className="container py-5 text-center">

                <div className="spinner-border text-success"></div>

                <h4 className="mt-3">

                    กำลังโหลดข้อมูล...

                </h4>

            </div>

        );

    }

    if (!album) {

        return (

            <div className="container py-5 text-center">

                <h3 className="fw-bold">

                    ไม่พบอัลบั้ม

                </h3>

                <Link

                    to="/gallery"

                    className="btn btn-success rounded-pill mt-4 px-4"

                >

                    ← กลับหน้าคลังภาพ

                </Link>

            </div>

        );

    }

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (

        <div
            className="container-fluid py-5"
            style={{
                maxWidth: "1600px",
                margin: "0 auto",
                paddingLeft: "32px",
                paddingRight: "32px"
            }}
        >

            <div
                className="mb-5"
                style={{
                    borderRadius: 28,
                    background: "#ffffff",
                    boxShadow: "0 35px 85px rgba(0,0,0,0.08)",
                    overflow: "hidden"
                }}
            >
                <div className="p-4 p-lg-5" style={{ background: "linear-gradient(180deg, #f7fcf9 0%, #ffffff 100%)" }}>
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
                        <div style={{ maxWidth: 680 }}>
                            <h1 className="fw-bold mb-3" style={{ fontSize: "2.6rem", lineHeight: 1.05 }}>
                                {album.activity_name}
                            </h1>
                        </div>
                        <div className="d-flex gap-2">
                            <Link
                                to="/gallery"
                                className="btn btn-outline-success rounded-pill px-4"
                            >
                                ← กลับ
                            </Link>
                            <button
                                type="button"
                                className="btn btn-outline-success rounded-pill px-4"
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    downloadAlbum();
                                }}
                            >
                                ดาวน์โหลดอัลบั้ม
                            </button>
                        </div>
                    </div>

                    <div className="row g-4 mb-4">
                        <div className="col-lg-3 col-md-6">
                            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 20 }}>
                                <div className="card-body text-center py-4">
                                    <h6 className="text-muted mb-2">วันที่จัดกิจกรรม</h6>
                                    <h5 className="fw-bold mb-0">{formatDate(album.activity_date)}</h5>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 20, background: "linear-gradient(135deg, #006664, #006664)", color: "#fff" }}>
                                <div className="card-body text-center py-4">
                                    <h6 className="mb-3 text-white">เวลาเริ่มต้น - สิ้นสุด</h6>
                                    <h5 className="fw-bold mb-0 text-white">
                                        {formatTime(album.start_time)} - {formatTime(album.end_time)}
                                    </h5>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 20 }}>
                                <div className="card-body text-center py-4">
                                    <h6 className="text-muted mb-2">สถานที่</h6>
                                    <h5 className="fw-bold mb-0">{album.location_name || "-"}</h5>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6">
                            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 20, background: "linear-gradient(135deg,#006664,#006664)", color: "#fff" }}>
                                <div className="card-body text-center py-4">
                                    <h6 className="mb-2">จำนวนรูปภาพ</h6>
                                    <h1 className="fw-bold mb-0">{album.images?.length || 0}</h1>
                                    <small>รูป</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row g-4 mb-4">
                        <div className="col-lg-8">
                            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 20 }}>
                                <div className="card-body p-4">
                                    <h5 className="fw-bold mb-3">คำอธิบายกิจกรรม</h5>
                                    <p className="mb-0" style={{ lineHeight: 1.8, color: "#333" }}>
                                        {album.description ? album.description : "ไม่มีคำอธิบายกิจกรรม"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4">
                            <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 20, overflow: "hidden" }}>
                                <ActivityPhotoMap
                                    images={album.images}
                                    locations={album.locations}
                                    latitude={album.latitude}
                                    longitude={album.longitude}
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Gallery */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <h3 className="fw-bold mb-0">

                    รูปภาพทั้งหมด

                </h3>

                <h5
                    className="fw-bold mb-0"
                    style={{
                        color: "#2a2b2a"
                    }}
                >
                    {album.images.length} รูป
                </h5>

            </div>

            <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-4">

                {album.images.map((image, index) => (

                    <div
                        className="col"
                        key={image.image_id}
                    >

                        <div
                            className="card border-0 shadow-sm h-100"
                            style={{
                                borderRadius: 20,
                                overflow: "hidden",
                                cursor: "pointer",
                                transition: "all .35s ease"
                            }}
                            onClick={() => {

                                setCurrentIndex(index);

                                setShowModal(true);

                            }}
                            onMouseEnter={(e) => {

                                e.currentTarget.style.transform =
                                    "translateY(-6px)";

                                e.currentTarget.style.boxShadow =
                                    "0 18px 35px rgba(0,0,0,.15)";

                                const img =
                                    e.currentTarget.querySelector("img");

                                if (img) {

                                    img.style.transform = "scale(1.05)";

                                }

                            }}
                            onMouseLeave={(e) => {

                                e.currentTarget.style.transform =
                                    "translateY(0)";

                                e.currentTarget.style.boxShadow = "";

                                const img =
                                    e.currentTarget.querySelector("img");

                                if (img) {

                                    img.style.transform = "scale(1)";

                                }

                            }}
                        >

                            <img
                                src={`http://localhost:5000${image.image_path}`}
                                alt={`${album.activity_name} ${index + 1}`}
                                className="w-100"
                                style={{
                                    height: 320,
                                    objectFit: "cover",
                                    transition: ".35s ease"
                                }}
                                                        onDoubleClick={async (e) => {
                                                            e.stopPropagation();
                                                            // allow owner/admin to delete
                                                            const userJson = localStorage.getItem("user") || sessionStorage.getItem("user");
                                                            const u = userJson ? JSON.parse(userJson) : null;
                                                            if (!u) return;
                                                            if (u.role !== 'admin' && u.user_id !== album.member_id) return;
                                                            const confirmed = await Swal.fire({
                                                                title: 'ลบรูปภาพ?',
                                                                icon: 'warning',
                                                                showCancelButton: true,
                                                                confirmButtonText: 'ลบ',
                                                                cancelButtonText: 'ยกเลิก',
                                                            });
                                                            if (confirmed.isConfirmed) {
                                                                try {
                                                                    await api.delete(`/gallery/image/${image.image_id}`);
                                                                    Swal.fire({ icon: 'success', title: 'ลบรูปสำเร็จ', timer: 1200, showConfirmButton: false });
                                                                    loadAlbum();
                                                                } catch (err) {
                                                                    Swal.fire({ icon: 'error', title: 'ลบไม่สำเร็จ' });
                                                                }
                                                            }
                                                        }}
                            />

                        </div>

                    </div>

                ))}

            </div>

            {/* Image Modal */}

            {

                showModal && (

                    <ImageModal
                        images={album.images}
                        currentIndex={currentIndex}
                        setCurrentIndex={setCurrentIndex}
                        onClose={() => setShowModal(false)}
                    />

                )

            }

        </div>

    );

};

export default GalleryDetail;
