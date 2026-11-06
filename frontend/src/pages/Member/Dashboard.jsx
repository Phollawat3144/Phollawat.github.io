// จุดประสงค์: โหลดและแสดงสถิติ ภาพ และกิจกรรมของสมาชิก
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "../../components/cards/StatCard";
import ActivityChart from "../../components/dashboard/ActivityChart";
import api from "../../services/api";
import "../../assets/css/member-dashboard.css";

const defaultStats = [
    { label: "ภาพทั้งหมด", value: "0", tone: "green" },
    { label: "กิจกรรม", value: "0", tone: "blue" },
    { label: "อัปโหลดแล้ว", value: "0", tone: "orange" }
];

const defaultChartData = [25, 35, 30, 50, 65, 45, 80];

const formatUploadDate = (value) => {
    if (!value) return "ไม่ระบุวันที่";

    const dateText = String(value).slice(0, 10);
    const [year, month, day] = dateText.split("-");

    if (!year || !month || !day) return dateText;

    const thaiMonths = [
        "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
        "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];

    return `${Number(day)} ${thaiMonths[Number(month) - 1] || month} ${Number(year) + 543}`;
};

const formatUploadTime = (value) => {
    if (!value) return "ไม่ระบุเวลา";

    const match = String(value).match(/(\d{1,2}):(\d{2})/);
    return match ? `${match[1].padStart(2, "0")}:${match[2]} น.` : String(value);
};

function Dashboard() {
    // สถานะและข้อมูลที่คอมโพเนนต์ใช้
    const [stats, setStats] = useState(defaultStats);
    const [recentUploads, setRecentUploads] = useState([]);
    const [recentPhotos, setRecentPhotos] = useState([]);
    const [chartData, setChartData] = useState(defaultChartData);
    const [loading, setLoading] = useState(true);

    // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const res = await api.get("/member/dashboard");

                if (res.data?.success) {
                    const summary = res.data.stats || {};
                    const nextStats = [
                        { label: "ภาพทั้งหมด", value: String(summary.photos ?? 0), tone: "green" },
                        { label: "กิจกรรม", value: String(summary.activities ?? 0), tone: "blue" },
                        { label: "อัปโหลดแล้ว", value: String(summary.uploads ?? 0), tone: "orange" }
                    ];

                    setStats(nextStats);

                    const uploads = Array.isArray(res.data.recentUploads) ? res.data.recentUploads : [];
                    setRecentUploads(uploads);

                    const photos = Array.isArray(res.data.latestPhotos) ? res.data.latestPhotos : [];
                    setRecentPhotos(
                        photos.slice(0, 3).map((item) => ({
                            title: `${item.image_id ?? "รูปภาพ"}`,
                            date: "ภาพล่าสุด",
                            image: item.image_path ? `http://localhost:5000${item.image_path}` : ""
                        }))
                    );

                    const monthly = Array.isArray(res.data.monthlyUploads) ? res.data.monthlyUploads : defaultChartData;
                    const normalized = monthly.length ? monthly.map((value) => Math.max(10, Number(value) * 12 || 0)) : defaultChartData;
                    setChartData(normalized.slice(-7));
                }
            } catch (err) {
                console.error("Load member dashboard failed:", err);
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (
        <div className="member-dashboard-container">
            <div className="row g-3 mb-4">
                {stats.map((item, index) => (
                    <StatCard
                        key={item.label}
                        title={item.label}
                        value={loading ? "..." : item.value}
                        color={["success", "primary", "warning", "danger"][index]}
                        columns={4}
                    />
                ))}
            </div>

            <div className="row g-3 mb-4 admin-dashboard-panels">
                <div className="col-lg-8">
                    <ActivityChart
                        monthlyData={chartData}
                        labels={['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.']}
                        title="ภาพรวมการอัปโหลด"
                    />
                </div>

                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold mb-0">ภาพล่าสุด</h5>
                                <Link to="/member/gallery" className="text-success fw-semibold">ดูทั้งหมด</Link>
                            </div>
                            <div className="member-photo-grid">
                                {recentPhotos.length === 0 ? <div className="member-empty-state">ยังไม่มีภาพที่อัปโหลด</div> : recentPhotos.map((photo) => (
                                    <div key={`${photo.title}-${photo.date}`} className="member-photo-card">
                                        <img src={photo.image || "https://via.placeholder.com/300x180?text=No+Image"} alt={photo.title} />
                                        <div className="member-photo-info"><strong>{photo.title}</strong><small>{photo.date}</small></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h4 className="fw-bold mb-1">รายการอัปโหลดล่าสุด</h4>
                            <small className="text-muted">กิจกรรมและไฟล์ภาพล่าสุดของคุณ</small>
                        </div>
                        <Link to="/member/gallery" className="btn btn-outline-success rounded-pill">ดูทั้งหมด</Link>
                    </div>
                    <div className="member-upload-list">
                        {recentUploads.length === 0 ? <div className="member-empty-state">ยังไม่มีรายการอัปโหลด</div> : recentUploads.map((item) => (
                            <div key={item.upload_id ?? `${item.activity_name}-${item.upload_date}`} className="member-upload-item">
                                <div>
                                    <div className="member-upload-title">{item.activity_name || "กิจกรรม"}</div>
                                    <small>
                                        {formatUploadDate(item.upload_date)} · {formatUploadTime(item.upload_time)}
                                    </small>
                                </div>
                                <span className="member-upload-badge">อัปโหลด</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
