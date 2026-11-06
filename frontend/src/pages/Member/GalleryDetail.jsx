// จุดประสงค์: โหลดและแสดงรายละเอียดอัลบั้มในพื้นที่สมาชิก
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ImageModal from "../../components/gallery/ImageModal";
import ActivityPhotoMap from "../../components/map/ActivityPhotoMap";
import api from "../../services/api";

function MemberGalleryDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    // สถานะและข้อมูลที่คอมโพเนนต์ใช้
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showModal, setShowModal] = useState(false);

    // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์

    useEffect(() => {
        const loadPhotos = async () => {
            try {
                const res = await api.get("/member/gallery");
                const list = (res.data.data || []).filter((item) => String(item.activity_id) === String(id));
                setPhotos(list);
            } catch (err) {
                console.error(err);
                setPhotos([]);
            } finally {
                setLoading(false);
            }
        };

        loadPhotos();
    }, [id]);

    if (loading) {
        return <div className="container py-5 text-center">Loading...</div>;
    }

    if (!photos.length) {
        return (
            <div className="container py-5 member-gallery-detail-page">
                    <div className="card border-0 shadow-sm rounded-4 member-gallery-missing-album">
                    <div className="card-body text-center py-5 text-muted">
                            <p className="mb-3">ไม่พบอัลบั้มนี้ อาจถูกลบโดยผู้ดูแลระบบแล้ว</p>
                            <button type="button" className="member-gallery-back-btn" onClick={() => navigate("/member/gallery")}>
                                กลับไปหน้า My Gallery
                            </button>
                        </div>
                    </div>
                </div>
        );
    }

    const album = photos[0];
    const formatThaiDate = (date) => date
        ? new Date(`${String(date).slice(0, 10)}T00:00:00`).toLocaleDateString("th-TH", {
            day: "numeric",
            month: "numeric",
            year: "numeric"
        })
        : "-";
    const formatTime = (time) => time ? String(time).slice(0, 5) : "ไม่ระบุเวลา";
    const formatTimeRange = (start, end) => {
        const startTime = formatTime(start);
        const endTime = formatTime(end);
        return `${startTime} - ${endTime} น.`;
    };

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (
        <div className="container-fluid py-4 member-gallery-detail-page">
            <div className="member-detail-shell">
                <div className="member-detail-header">
                    <h1 className="member-detail-page-heading">{album.activity_name || "อัลบั้มกิจกรรม"}</h1>

                    <div className="member-detail-header-actions">
                        <button type="button" className="member-detail-back-btn" onClick={() => navigate(-1)}>
                            <span aria-hidden="true">←</span> กลับ
                        </button>
                        <button type="button" className="member-detail-download-btn" onClick={() => setShowModal(true)}>
                            ดาวน์โหลดอัลบั้ม
                        </button>
                    </div>
                </div>

                <div className="member-detail-summary-grid">
                    <div className="member-detail-summary-card light">
                        <div className="member-detail-label">วันที่จัดกิจกรรม</div>
                        <div className="member-detail-value">{formatThaiDate(album.activity_date)}</div>
                    </div>

                    <div className="member-detail-summary-card green">
                        <div className="member-detail-label light">เวลาเริ่มต้น - สิ้นสุด</div>
                        <div className="member-detail-value light">{formatTimeRange(album.start_time, album.end_time)}</div>
                    </div>

                    <div className="member-detail-summary-card light">
                        <div className="member-detail-label">สถานที่</div>
                        <div className="member-detail-value" style={{ fontSize: "1.1rem" }}>{album.location_name || "สถานที่ไม่ระบุ"}</div>
                    </div>

                    <div className="member-detail-summary-card green">
                        <div className="member-detail-label light">จำนวนรูปภาพ</div>
                        <div className="member-detail-value light" style={{ fontSize: "2.4rem", lineHeight: 1.1 }}>
                            {photos.length}
                            <span style={{ fontSize: "1.2rem", marginLeft: "0.35rem" }}>รูป</span>
                        </div>
                    </div>
                </div>

                <div className="member-detail-lower-grid">
                    <div className="member-detail-description-box">
                        <h3 className="member-detail-section-title">คำอธิบายกิจกรรม</h3>
                        <p>{album.description || "ไม่มีคำอธิบายกิจกรรม"}</p>
                    </div>

                    <div className="member-detail-map-box">
                        <ActivityPhotoMap
                            images={photos.map((photo) => ({
                                latitude: photo.image_latitude,
                                longitude: photo.image_longitude,
                                captured_at: photo.captured_at
                            }))}
                            latitude={album.latitude}
                            longitude={album.longitude}
                        />
                    </div>
                </div>

                <div className="member-detail-gallery-section">
                    <div className="member-detail-gallery-header">
                        <h3>รูปภาพทั้งหมด</h3>
                        <span>{photos.length} รูป</span>
                    </div>

                    <div className="member-detail-gallery-grid">
                        {photos.map((image, index) => (
                            <div
                                className="member-detail-gallery-item"
                                key={image.image_id || `${image.image_path}-${index}`}
                                onClick={() => {
                                    setSelectedIndex(index);
                                    setShowModal(true);
                                }}
                            >
                                <img
                                    src={`http://localhost:5000${image.image_path}`}
                                    alt={`${album.activity_name || "รูปภาพ"} ${index + 1}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showModal && (
                <ImageModal
                    images={photos}
                    currentIndex={selectedIndex}
                    setCurrentIndex={setSelectedIndex}
                    onClose={() => setShowModal(false)}
                    activityName={album.activity_name || "ภาพส่วนตัว"}
                />
            )}
        </div>
    );
}

export default MemberGalleryDetail;
