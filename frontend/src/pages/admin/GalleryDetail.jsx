// จุดประสงค์: แสดงและจัดการรายละเอียดอัลบั้มและภาพในส่วนผู้ดูแลระบบ
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Swal from "sweetalert2";

import AdminLayout from "../../layouts/AdminLayout";
import ImageModal from "../../components/gallery/ImageModal";
import ActivityPhotoMap from "../../components/map/ActivityPhotoMap";
import api from "../../services/api";

function GalleryDetail() {

    const { id } = useParams();

    // สถานะและข้อมูลที่คอมโพเนนต์ใช้

    const [album, setAlbum] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์

    useEffect(() => {

        loadAlbum();

    }, [id]);

    const loadAlbum = async () => {

        try {

            const res = await api.get(`/gallery/${id}`);

            setAlbum(res.data.data);

        } catch (err) {

            console.log(err);

        } finally {

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

        return String(time).substring(0, 5);

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

    // จัดการเหตุการณ์และการเปลี่ยนแปลงข้อมูล
    const deleteImage = async (imageId) => {

        const result = await Swal.fire({

            title: "ลบรูปภาพ ?",

            text: "ไม่สามารถกู้คืนได้",

            icon: "warning",

            showCancelButton: true,

            confirmButtonText: "ลบ",

            cancelButtonText: "ยกเลิก"

        });

        if (!result.isConfirmed) return;

        try {

            await api.delete(`/gallery/image/${imageId}`);

            Swal.fire({

                icon: "success",

                title: "ลบสำเร็จ",

                timer: 1200,

                showConfirmButton: false

            });

            loadAlbum();

        } catch (err) {

            console.log(err);

            Swal.fire("ผิดพลาด", "", "error");

        }

    };

    const uploadImages = async (e) => {

        const files = e.target.files;

        if (!files.length) return;

        const formData = new FormData();

        formData.append("activity_id", id);

        for (let i = 0; i < files.length; i++) {

            formData.append("images", files[i]);

        }

        try {

            await api.post(

                "/gallery/upload",

                formData,

                {

                    headers: {

                        "Content-Type": "multipart/form-data"

                    }

                }

            );

            Swal.fire({

                icon: "success",

                title: "อัปโหลดสำเร็จ",

                timer: 1200,

                showConfirmButton: false

            });

            loadAlbum();

        } catch (err) {

            console.log(err);

            Swal.fire("Upload ไม่สำเร็จ", "", "error");

        }

    };

    if (loading) {

        return (

            <AdminLayout>

                <div className="text-center py-5">

                    <div className="spinner-border text-success"></div>

                </div>

            </AdminLayout>

        );

    }

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (

        <AdminLayout>

            <div className="container-fluid">

                {/* Header */}

                <div
                    className="card border-0 shadow-sm mb-5"
                    style={{
                        borderRadius: 24
                    }}
                >

                    <div className="card-body px-4 py-4">

                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">

                            <div>

                                <h1 className="fw-bold mb-2">

                                    {album.activity_name}

                                </h1>

                            </div>

                            <div className="d-flex gap-2">

                                <Link
                                    to="/dashboard/gallery"
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

                    </div>

                </div>

                {/* Summary */}

                <div className="row g-4 mb-4">

                    <div className="col-lg-3 col-md-6">

                        <div
                            className="card border-0 shadow-sm h-100"
                            style={{
                                borderRadius: 20
                            }}
                        >

                            <div className="card-body text-center py-4">
                                <h6 className="text-muted mt-3">
                                    วันที่จัดกิจกรรม
                                </h6>

                                <h5 className="fw-bold mt-2">
                                    {formatDate(album.activity_date)}
                                </h5>

                            </div>

                        </div>

                    </div>

                    <div className="col-lg-3 col-md-6">

                        <div
                            className="card border-0 shadow-sm h-100"
                            style={{
                                borderRadius: 20,
                                background: "linear-gradient(135deg, #006664, #006664)",
                                color: "#fff"
                            }}
                        >

                            <div className="card-body text-center py-4">

                                <h6 className="mt-3">
                                    เวลาเริ่มต้น - สิ้นสุด
                                </h6>

                                <h5 className="fw-bold mt-2">
                                    {formatTime(album.start_time)} - {formatTime(album.end_time)}
                                </h5>

                            </div>

                        </div>

                    </div>

                    <div className="col-lg-3 col-md-6">

                        <div
                            className="card border-0 shadow-sm h-100"
                            style={{
                                borderRadius: 20
                            }}
                        >

                            <div className="card-body text-center py-4">

                                <h6 className="text-muted mt-3">
                                    สถานที่
                                </h6>

                                <h5 className="fw-bold mt-2">
                                    {album.location_name || "-"}
                                </h5>

                            </div>

                        </div>

                    </div>

                    <div className="col-lg-3 col-md-6">

                        <div
                            className="card border-0 shadow-sm h-100"
                            style={{
                                borderRadius: 20,
                                background:
                                    "linear-gradient(135deg,#006664,#006664)",
                                color: "#fff"
                            }}
                        >

                            <div className="card-body text-center py-4">

                                <h6 className="mt-3">
                                    จำนวนรูปภาพ
                                </h6>

                                <h1 className="fw-bold mt-2">
                                    {album.images?.length || 0}
                                </h1>

                                <small>
                                    รูป
                                </small>

                            </div>

                        </div>

                    </div>

                </div>

                {/* Activity details */}

                <div className="row g-4 mb-4">

                    <div className="col-lg-8">

                        <div
                            className="card border-0 shadow-sm h-100"
                            style={{
                                borderRadius: 20
                            }}
                        >

                            <div className="card-body p-4">

                                <h5 className="fw-bold mb-3">
                                    คำอธิบายกิจกรรม
                                </h5>

                                <p
                                    className="mb-0"
                                    style={{
                                        lineHeight: 1.8,
                                        color: "#333",
                                        whiteSpace: "pre-wrap"
                                    }}
                                >
                                    {album.description || "ไม่มีคำอธิบายกิจกรรม"}
                                </p>

                            </div>

                        </div>

                    </div>

                    <div className="col-lg-4">

                        <div
                            className="card border-0 shadow-sm h-100"
                            style={{
                                borderRadius: 20,
                                overflow: "hidden"
                            }}
                        >

                            {album.latitude != null && album.longitude != null ? (

                                <>

                                    <ActivityPhotoMap
                                        images={album.images}
                                        locations={album.locations}
                                        latitude={album.latitude}
                                        longitude={album.longitude}
                                    />

                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${album.latitude},${album.longitude}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="d-block text-center text-success fw-semibold py-3 text-decoration-none"
                                    >
                                        เปิดใน Google Maps
                                    </a>

                                </>

                            ) : (

                                <div
                                    className="d-flex align-items-center justify-content-center h-100 text-muted px-3 text-center"
                                    style={{
                                        minHeight: 320
                                    }}
                                >
                                    ไม่พบพิกัดกิจกรรม
                                </div>

                            )}

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
                        {album.images?.length || 0} รูป
                    </h5>

                </div>

                <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">

                    {(album.images || []).map((image, index) => (
                        <div className="col" key={image.image_id}>

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
                                    const img = e.currentTarget.querySelector("img");
                                    if (img) {
                                        img.style.transform = "scale(1.05)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform =
                                        "translateY(0)";
                                    e.currentTarget.style.boxShadow = "";
                                    const img = e.currentTarget.querySelector("img");
                                    if (img) {
                                        img.style.transform = "scale(1)";
                                    }
                                }}
                            >

                                <div
                                    style={{
                                        position: "relative",
                                        width: "100%",
                                        paddingBottom: "72%",
                                        overflow: "hidden",
                                        background: "#f5f5f5"
                                    }}
                                >
                                    <img
                                        src={`http://localhost:5000${image.image_path}`}
                                        alt={`${album.activity_name} ${index + 1}`}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            objectPosition: "center",
                                            transition: ".35s ease"
                                        }}
                                    />
                                </div>

                            </div>

                        </div>
                    ))}

            </div>

            {showModal && (

                <ImageModal

                    images={album.images}

                    currentIndex={currentIndex}

                    setCurrentIndex={setCurrentIndex}

                    onClose={() => setShowModal(false)}

                />

            )}

        </div>

        </AdminLayout >

    );

}

export default GalleryDetail;
