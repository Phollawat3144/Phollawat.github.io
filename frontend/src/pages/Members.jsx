// จุดประสงค์: แสดงและจัดการรายชื่อสมาชิก รวมถึงการค้นหาและการแก้ไขข้อมูล
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import confirmLogout from "../services/confirmLogout";
import Swal from "sweetalert2";
import StatCard from "../components/cards/StatCard";
import ActivityChart from "../components/dashboard/ActivityChart";
import RecentGallery from "../components/dashboard/RecentGallery";
import LocationPicker from "../components/map/LocationPicker";

function Members() {
    const navigate = useNavigate();
    // สถานะและข้อมูลที่คอมโพเนนต์ใช้
    const [userName, setUserName] = useState("");
    const [userId, setUserId] = useState(null);
    const [activities, setActivities] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [currentAlbum, setCurrentAlbum] = useState(null);
    const [uploadFiles, setUploadFiles] = useState([]);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadDescription, setUploadDescription] = useState("");
    const [uploadDate, setUploadDate] = useState("");
    const [uploadStartTime, setUploadStartTime] = useState("");
    const [uploadEndTime, setUploadEndTime] = useState("");
    const [position, setPosition] = useState(null);
    const [useGps, setUseGps] = useState(false);
    const [stats, setStats] = useState({
        activities: 0,
        photos: 0,
        locations: 0,
        news: 0
    });

    // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์

    useEffect(() => {
        const userJson = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (userJson) {
            const user = JSON.parse(userJson);
            setUserName(user.fullname || user.username || user.email || "สมาชิก");
            setUserId(user.user_id || user.id || null);
        }
    }, []);

    useEffect(() => {
        if (userId) {
            loadActivities();
            loadAlbums();
        }
    }, [userId]);

    const loadActivities = async () => {
        try {
            const res = await api.get("/activities", {
                params: {
                    member_id: userId
                }
            });

            if (res.data.success) {
                const personalActivities = res.data.data || [];
                setActivities(personalActivities);
                setStats({
                    activities: personalActivities.length,
                    photos: personalActivities.reduce((sum, item) => sum + (item.images?.length || 0), 0),
                    locations: personalActivities.filter((item) => item.latitude || item.longitude).length,
                    news: personalActivities.filter((item) => item.news_id).length
                });
            }
        } catch (err) {
            console.log(err);
        }
    };

    const loadAlbums = async () => {
        try {
            const res = await api.get("/gallery");
            if (res.data.success) {
                setAlbums((res.data.data || []).filter((album) => album.admin_id));
            }
        } catch (err) {
            console.log(err);
        }
    };

    // จัดการเหตุการณ์และการเปลี่ยนแปลงข้อมูล
    const openUploadModal = (album) => {
        setCurrentAlbum(album);
        setUploadDescription(album.description || "");
        setUploadDate(album.activity_date ? album.activity_date.split("T")[0] : "");
        setUploadStartTime(album.start_time || "");
        setUploadEndTime(album.end_time || "");
        setPosition(album.latitude && album.longitude ? { lat: Number(album.latitude), lng: Number(album.longitude) } : null);
        setUploadFiles([]);
        setShowUploadModal(true);
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        setUploadFiles(files);
    };

    const uploadToAlbum = async () => {
        if (!currentAlbum) return;
        if (uploadFiles.length === 0) {
            return Swal.fire({ icon: "warning", title: "กรุณาเลือกไฟล์ก่อนอัปโหลด" });
        }

        const formData = new FormData();
        uploadFiles.forEach((file) => formData.append("images", file));
        // include optional metadata (backend may ignore unknown fields)
        formData.append("description", uploadDescription || "");
        formData.append("activity_date", uploadDate || "");
        formData.append("start_time", uploadStartTime || "");
        formData.append("end_time", uploadEndTime || "");
        if (position) {
            formData.append("latitude", position.lat);
            formData.append("longitude", position.lng);
        }

        try {
            setUploadLoading(true);
            await api.post(`/gallery/${currentAlbum.activity_id}/upload`, formData);
            Swal.fire({ icon: "success", title: "อัปโหลดรูปสำเร็จ", timer: 1400, showConfirmButton: false });
            setShowUploadModal(false);
            loadAlbums();
        } catch (err) {
            console.error(err);
            Swal.fire({ icon: "error", title: "อัปโหลดไม่สำเร็จ", text: err.response?.data?.message || err.message });
        } finally {
            setUploadLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return "ไม่ระบุวันที่";
        return new Date(date).toLocaleDateString("th-TH", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    };

    const handleLogout = () => confirmLogout(navigate);

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (
        <div className="container-fluid py-5">
            <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
                    <div>
                        <h1 className="fw-bold mb-1">แดชบอร์ดสมาชิก</h1>
                        <p className="text-muted mb-0">ยินดีต้อนรับกลับ, {userName}</p>
                    </div>
                    <button onClick={handleLogout} className="btn btn-outline-danger btn-lg">
                        ออกจากระบบ
                    </button>
                </div>
            </div>
            {/* Upload Modal */}
            {showUploadModal && currentAlbum && (
                <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                    <div className="card" style={{ width: 820, borderRadius: 12, overflow: 'hidden' }}>
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="fw-bold mb-0">อัปโหลดรูปเข้าอัลบั้ม</h5>
                                        <div style={{ minWidth: 260 }}>
                                            <label className="form-label mb-1">เลือกอัลบั้มจากแอดมิน</label>
                                            <select className="form-select" value={currentAlbum?.activity_id || ""} onChange={(e)=>{
                                                const id = e.target.value;
                                                const sel = albums.find(a=>String(a.activity_id) === String(id));
                                                setCurrentAlbum(sel || null);
                                                if (sel) {
                                                    setUploadDescription(sel.description || "");
                                                    setUploadDate(sel.activity_date ? sel.activity_date.split('T')[0] : '');
                                                    setUploadStartTime(sel.start_time || '');
                                                    setUploadEndTime(sel.end_time || '');
                                                    setPosition(sel.latitude && sel.longitude ? { lat: Number(sel.latitude), lng: Number(sel.longitude) } : null);
                                                }
                                            }}>
                                                <option value="">-- เลือกอัลบั้ม --</option>
                                                {albums.map((a)=>(<option key={a.activity_id} value={a.activity_id}>{a.activity_name}</option>))}
                                            </select>
                                        </div>
                                <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowUploadModal(false)}>ปิด</button>
                            </div>

                            <div className="row g-3 align-items-center">
                                <div className="col-md-8">
                                    <label className="form-label">เลือกรูปภาพ</label>
                                    <input type="file" accept="image/jpeg,image/jpg" multiple className="form-control" onChange={handleFileChange} />
                                    <small className="text-muted">รองรับหลายไฟล์</small>
                                </div>
                                <div className="col-md-4 d-grid">
                                    <label className="form-label invisible">space</label>
                                    <button className="btn btn-success" onClick={uploadToAlbum} disabled={uploadLoading}>
                                        {uploadLoading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูป'}
                                    </button>
                                </div>
                            </div>

                            <div className="row g-3 mt-3">
                                <div className="col-md-6">
                                    <label className="form-label">วันที่</label>
                                    <input type="date" className="form-control" value={uploadDate} onChange={(e)=>setUploadDate(e.target.value)} />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">เวลาเริ่ม</label>
                                    <input type="time" className="form-control" value={uploadStartTime} onChange={(e)=>setUploadStartTime(e.target.value)} />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label">เวลาจบ</label>
                                    <input type="time" className="form-control" value={uploadEndTime} onChange={(e)=>setUploadEndTime(e.target.value)} />
                                </div>
                            </div>

                            <div className="row g-3 mt-3">
                                <div className="col-12 d-flex align-items-center gap-3">
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" id="useGps" checked={useGps} onChange={async (e)=>{
                                            setUseGps(e.target.checked);
                                            if (e.target.checked && navigator.geolocation) {
                                                navigator.geolocation.getCurrentPosition((pos)=>{
                                                    setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                                                }, ()=>{
                                                    Swal.fire({ icon: 'warning', title: 'ไม่สามารถรับตำแหน่ง GPS ได้' });
                                                    setUseGps(false);
                                                });
                                            }
                                        }} />
                                        <label className="form-check-label" htmlFor="useGps">ใช้ GPS อัตโนมัติ</label>
                                    </div>
                                    <div className="ms-auto">
                                        <small className="text-muted">หรือเลือกตำแหน่งบนแผนที่ด้านล่าง</small>
                                    </div>
                                </div>
                            </div>

                            <div className="row g-3 mt-3">
                                <div className="col-12">
                                    <label className="form-label">ตำแหน่งกิจกรรม</label>
                                    <div style={{ borderRadius: 12, overflow: 'hidden' }}>
                                        <LocationPicker
                                            position={position}
                                            setPosition={(selectedPosition) => {
                                                setPosition(selectedPosition);
                                                setUseGps(false);
                                            }}
                                            selectable
                                            label={currentAlbum?.activity_name || ""}
                                            mapHeight={300}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3">
                                <label className="form-label">คำอธิบาย</label>
                                <textarea className="form-control" rows={3} value={uploadDescription} onChange={(e)=>setUploadDescription(e.target.value)} />
                            </div>

                            {uploadFiles.length > 0 && (
                                <p className="mt-3 mb-0 text-muted">เลือกแล้ว {uploadFiles.length} ไฟล์</p>
                            )}

                        </div>
                    </div>
                </div>
            )}

            <div className="row g-4 mb-4">
                <StatCard title="กิจกรรม" value={stats.activities} color="success" />
                <StatCard title="รูปภาพ" value={stats.photos} color="primary" />
                <StatCard title="ตำแหน่ง" value={stats.locations} color="warning" />
                <StatCard title="ข่าว" value={stats.news} color="danger" />
            </div>

            {/* Preview removed: admin albums are selected inside upload modal now */}

            <div className="row g-4 mb-4">
                <div className="col-lg-8">
                    <ActivityChart activities={activities} />
                </div>
                <div className="col-lg-4">
                    <RecentGallery activities={activities} />
                </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                        <div>
                            <h4 className="fw-bold mb-1">อัลบั้มแอดมิน</h4>
                            <p className="text-muted mb-0">แสดงอัลบั้มทั้งหมดที่แอดมินสร้างไว้ สมาชิกสามารถคลิกเข้าไปเพิ่มรูปได้</p>
                        </div>
                        <Link to="/gallery" className="btn btn-outline-success rounded-pill">
                            ดูอัลบั้มทั้งหมด
                        </Link>
                    </div>

                    {albums.length === 0 ? (
                        <div className="text-center py-5">
                            <h5 className="mb-2">ยังไม่มีอัลบั้ม</h5>
                            <p className="text-muted">รอสักครู่หรือกลับมาภายหลัง</p>
                        </div>
                    ) : (
                        <div className="row gx-4 gy-4">
                            {albums.map((album) => (
                                <div className="col-xl-3 col-lg-4 col-md-6" key={album.activity_id}>
                                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 24, overflow: "hidden" }}>
                                        <Link to={`/gallery/${album.activity_id}`} style={{ textDecoration: "none", color: "inherit" }}>
                                            <div style={{ height: 230, overflow: "hidden" }}>
                                                <img
                                                    src={`http://localhost:5000${album.cover_image}`}
                                                    alt={album.activity_name}
                                                    className="w-100"
                                                    style={{ height: "100%", objectFit: "cover" }}
                                                />
                                            </div>
                                            <div className="card-body">
                                                <h5 className="fw-bold mb-2" style={{ minHeight: 56 }}>
                                                    {album.activity_name}
                                                </h5>
                                                <p className="text-muted mb-2" style={{ fontSize: 14, minHeight: 44 }}>
                                                    {album.location_name || "ไม่ระบุสถานที่"}
                                                </p>
                                                <p className="text-muted mb-3" style={{ fontSize: 13 }}>
                                                    {formatDate(album.activity_date)}
                                                </p>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="badge rounded-pill bg-success px-3 py-2">{album.total_images || 0} รูป</span>
                                                    <div className="d-flex gap-2 align-items-center">
                                                        <Link to={`/gallery/${album.activity_id}`} className="text-success fw-semibold" style={{ textDecoration: 'none' }}>ดูอัลบั้ม →</Link>
                                                        <button type="button" className="btn btn-outline-success btn-sm" onClick={(e)=>{ e.preventDefault(); openUploadModal(album); }}>
                                                            เพิ่มรูป
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Members;
