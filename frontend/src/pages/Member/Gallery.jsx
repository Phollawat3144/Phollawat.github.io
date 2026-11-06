// จุดประสงค์: แสดงรายการอัลบั้มของสมาชิกและตัวเลือกค้นหา
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaCalendarAlt, FaClock, FaImages, FaSearch, FaFolderOpen, FaUpload, FaFilter, FaMapMarkerAlt } from "react-icons/fa";
import api from "../../services/api";

function MemberGallery() {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const loadPhotos = async () => {
            try {
                const res = await api.get("/member/gallery");
                setPhotos(res.data.data || []);
            } catch (err) {
                console.error(err);
                setPhotos([]);
            } finally {
                setLoading(false);
            }
        };

        loadPhotos();
    }, []);

    const formatDate = (date) => date ? String(date).slice(0, 10).split("-").reverse().join("/") : "-";
    const formatTime = (time) => time ? String(time).slice(0, 5) : "ไม่ระบุเวลา";

    const albums = Object.values(photos.reduce((groups, photo) => {
        const key = String(photo.activity_id || photo.upload_id);
        if (!groups[key]) {
            groups[key] = {
                upload_id: photo.activity_id || photo.upload_id,
                activity_name: photo.activity_name || "ภาพส่วนตัว",
                description: photo.description || "ไม่มีคำอธิบายกิจกรรม",
                activity_date: photo.activity_date,
                start_time: photo.start_time,
                end_time: photo.end_time,
                location_name: photo.location_name,
                cover: photo.image_path,
                total_images: 0,
            };
        }
        groups[key].total_images += 1;
        return groups;
    }, {}));

    const filtered = albums.filter((item) => {
        const keyword = search.toLowerCase();
        const activity = (item.activity_name || "").toLowerCase();
        const description = (item.description || "").toLowerCase();
        const location = (item.location_name || "").toLowerCase();
        return activity.includes(keyword) || description.includes(keyword) || location.includes(keyword);
    });

    const totalPhotos = photos.length;
    const thisMonth = photos.filter((item) => {
        const filename = String(item.image_path || "").split("/").pop();
        const timestamp = filename.match(/^(\d{13})(?:-\d+)?(?:\.[^.]+)?$/);
        if (!timestamp) return false;

        const date = new Date(Number(timestamp[1]));
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    return (
        <div className="container-fluid py-4 member-gallery-page">
            <div className="member-gallery-shell">
                <div className="member-gallery-search input-group mb-4">
                    <span className="input-group-text bg-white border-0"><FaSearch className="text-secondary" /></span>
                    <input
                        type="text"
                        className="form-control member-admin-input border-0"
                        placeholder="ค้นหาชื่อกิจกรรม วันที่ สถานที่ หรือรายละเอียด..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="member-gallery-stats">
                    <div className="member-gallery-stat">
                        <div className="member-gallery-stat-content">
                            <div className="label"><FaUpload className="me-2" />อัปโหลดทั้งหมด</div>
                            <div className="value-row">
                                <span className="value">{totalPhotos}</span>
                                <span className="value-unit">ภาพ</span>
                            </div>
                        </div>
                        <span className="badge bg-success bg-opacity-10 text-success"><FaFolderOpen className="me-1" />รวม</span>
                    </div>

                    <div className="member-gallery-stat">
                        <div className="member-gallery-stat-content">
                            <div className="label"><FaCalendarAlt className="me-2" />อัปโหลดเดือนนี้</div>
                            <div className="value-row">
                                <span className="value">{thisMonth}</span>
                                <span className="value-unit">ภาพ</span>
                            </div>
                        </div>
                        <span className="badge bg-primary bg-opacity-10 text-primary"><FaClock className="me-1" />ล่าสุด</span>
                    </div>

                    <div className="member-gallery-stat">
                        <div className="member-gallery-stat-content">
                            <div className="label"><FaImages className="me-2" />อัลบั้มทั้งหมด</div>
                            <div className="value-row">
                                <span className="value">{filtered.length}</span>
                                <span className="value-unit">อัลบั้ม</span>
                            </div>
                        </div>
                        <span className="badge bg-warning bg-opacity-10 text-warning"><FaFilter className="me-1" />ค้นหา</span>
                    </div>
                </div>

                {loading ? (
                    <div className="member-gallery-loading">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="member-gallery-empty">ยังไม่มีรูปภาพในคลังของคุณ</div>
                ) : (
                        <div className="row g-4">
                            {filtered.map((album) => (
                                <div className="col-xl-4 col-lg-4 col-md-6" key={album.upload_id}>
                                    <Link to={`/member/gallery/${album.upload_id}`} className="text-decoration-none text-dark">
                                        <div className="card border-0 shadow-sm h-100 member-album-card">
                                            <div className="member-album-cover">
                                                {album.cover && (
                                                    <img
                                                        src={`http://localhost:5000${album.cover}`}
                                                        alt={album.activity_name}
                                                        onError={(event) => {
                                                            event.currentTarget.style.display = "none";
                                                            event.currentTarget.nextElementSibling.style.display = "flex";
                                                        }}
                                                    />
                                                )}

                                                <div
                                                    className="member-album-cover-fallback"
                                                    style={{ display: album.cover ? "none" : "flex" }}
                                                >
                                                    <FaImages />
                                                </div>
                                            </div>
                                            <div className="card-body p-4 d-flex flex-column position-relative member-album-body">
                                                <span className="member-album-count badge rounded-pill px-3 py-2"><FaImages className="me-2" />{album.total_images} รูป</span>

                                                <h4 className="mb-3 member-album-title">{album.activity_name}</h4>

                                                <div className="member-album-meta mb-2">
                                                    <span className="member-album-meta-icon"><FaCalendarAlt /></span>
                                                    <span className="member-album-meta-text">
                                                        <span className="member-album-meta-label">วันที่</span>
                                                        <span>{formatDate(album.activity_date)}</span>
                                                    </span>
                                                </div>

                                                <div className="member-album-meta mb-3">
                                                    <span className="member-album-meta-icon"><FaClock /></span>
                                                    <span className="member-album-meta-text">
                                                        <span className="member-album-meta-label">เวลา</span>
                                                        <span>{formatTime(album.start_time)} - {formatTime(album.end_time)}</span>
                                                    </span>
                                                </div>

                                                <p className="member-album-description mb-4">
                                                    <span className="member-album-meta-icon inline-icon"><FaMapMarkerAlt /></span>
                                                    <span className="member-album-meta-text">
                                                        <span className="member-album-meta-label">สถานที่</span>
                                                        <span>{album.location_name || "สถานที่ไม่ระบุ"}</span>
                                                    </span>
                                                </p>

                                                <div className="mt-auto d-flex justify-content-end align-items-center gap-2">
                                                    <span className="member-album-link"><FaFolderOpen className="me-1" />ดูอัลบั้ม →</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                )}
            </div>
        </div>
    );
}

export default MemberGallery;
