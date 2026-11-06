// จุดประสงค์: ประกอบเนื้อหาหน้าแรกและโหลดข้อมูลที่ใช้แสดงภาพรวม
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaCalendarAlt, FaClock, FaImages, FaMapMarkerAlt } from "react-icons/fa";

import Hero from "../components/layout/Hero";
import GalleryPreview from "../components/home/GalleryPreview";
import ActivityHistoryMap from "../components/map/ActivityHistoryMap";
import api from "../services/api";
import "../assets/css/latestActivities.css";

const API_URL = "http://localhost:5000";

const getLocalDate = (date) => [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
].join("-");

function Home() {

    // สถานะและข้อมูลที่คอมโพเนนต์ใช้

    const [activities, setActivities] = useState([]);
    const [upcomingActivities, setUpcomingActivities] = useState([]);
    const [pastActivities, setPastActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์

    useEffect(() => {
        const loadActivities = async () => {
            try {
                const res = await api.get("/activities");

                if (res.data.success) {
                    const allItems = Array.isArray(res.data.data) ? res.data.data : [];
                    const now = new Date();
                    const today = getLocalDate(now);
                    const currentTime = [
                        String(now.getHours()).padStart(2, "0"),
                        String(now.getMinutes()).padStart(2, "0")
                    ].join(":");
                    const past = allItems.filter((activity) => {
                        const activityDate = String(activity.activity_date || "").slice(0, 10);
                        if (!/^\d{4}-\d{2}-\d{2}$/.test(activityDate)) {
                            return false;
                        }

                        if (activityDate < today) {
                            return true;
                        }

                        if (activityDate > today) {
                            return false;
                        }

                        const endTime = String(activity.end_time || activity.start_time || "").slice(0, 5);
                        return Boolean(endTime) && endTime < currentTime;
                    }).sort((first, second) => {
                        const dateOrder = String(second.activity_date).localeCompare(
                            String(first.activity_date)
                        );
                        return dateOrder || String(second.start_time || "").localeCompare(
                            String(first.start_time || "")
                        );
                    });
                    setPastActivities(past);

                    const activitiesWithImages = allItems.filter(
                        activity =>
                            (Array.isArray(activity.images) && activity.images.length > 0) ||
                            Boolean(activity.activity_image)
                    );

                    setActivities(activitiesWithImages.slice(0, 3));

                    const upcoming = allItems
                        .filter((activity) => {
                            if (activity.has_member_upload) {
                                return false;
                            }

                            const activityDate = String(activity.activity_date || "").slice(0, 10);
                            if (!/^\d{4}-\d{2}-\d{2}$/.test(activityDate) || activityDate < today) {
                                return false;
                            }

                            if (activityDate > today) {
                                return true;
                            }

                            const lastActivityTime = activity.end_time || activity.start_time;
                            return !lastActivityTime ||
                                String(lastActivityTime).slice(0, 5) >= currentTime;
                        })
                        .sort((first, second) => {
                            const dateOrder = String(first.activity_date).localeCompare(
                                String(second.activity_date)
                            );
                            if (dateOrder !== 0) {
                                return dateOrder;
                            }

                            return String(first.start_time || "").localeCompare(
                                String(second.start_time || "")
                            );
                        });

                    setUpcomingActivities(upcoming.slice(0, 3));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadActivities();
    }, []);

    const formatDate = (date) => {

        if (!date) return "-";

        return new Date(date).toLocaleDateString("th-TH", {

            day: "numeric",
            month: "long",
            year: "numeric"

        });

    };

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (

        <>

            {/* ================= HERO ================= */}

            <Hero />

            {/* ================= ACTIVITIES ================= */}

            <section
                className="home-activities-section"
            >

                <div className="container-fluid home-activities-container">

                    <div className="text-center mb-5">

                        <h2 className="fw-bold mt-3 home-activities-title">

                            กิจกรรมล่าสุด

                        </h2>

                        <p className="text-muted">

                            เปิดดูภาพกิจกรรมล่าสุดของชมรม

                        </p>

                    </div>
                    {

                        loading ?

                            (

                                <div className="text-center py-5">

                                    <div
                                        className="spinner-border text-success"
                                        role="status"
                                    >
                                        <span className="visually-hidden">
                                            Loading...
                                        </span>
                                    </div>

                                </div>

                            )
                            :

                            activities.length === 0 ?

                                (

                                    <div className="text-center py-5">

                                        <h4 className="fw-bold">

                                            ยังไม่มีกิจกรรม

                                        </h4>

                                        <p className="text-muted">

                                            กรุณารอข้อมูลกิจกรรมจากระบบสักครู่

                                        </p>

                                    </div>

                                )
                                :

                                (

                                    <div className="row g-4 home-activities-row">

                                        {

                                            activities.map((activity) => (

                                                <div
                                                    className="col-lg-4 col-md-6"
                                                    key={activity.activity_id}
                                                >

                                                    <div
                                                        className="card h-100 border-0 shadow-lg activity-card"
                                                        style={{
                                                            borderRadius: "24px",
                                                            overflow: "hidden",
                                                            transition: ".35s"
                                                        }}
                                                    >

                                                        <div
                                                            className="home-activity-image"
                                                            style={{
                                                                height: "260px",
                                                                overflow: "hidden"
                                                            }}
                                                        >

                                                            {activity.activity_image && (
                                                                <img
                                                                    src={`${API_URL}${activity.activity_image}`}
                                                                    alt={activity.activity_name}
                                                                    className="w-100 h-100"
                                                                    onError={(event) => {
                                                                        event.currentTarget.style.display = "none";
                                                                        event.currentTarget.nextElementSibling.style.display = "flex";
                                                                    }}
                                                                    style={{
                                                                        objectFit: "cover",
                                                                        transition: ".5s"
                                                                    }}
                                                                />
                                                            )}

                                                            <div
                                                                className="activity-image-fallback"
                                                                style={{
                                                                    display: activity.activity_image ? "none" : "flex",
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

                                                        <div
                                                            className="card-body p-4 d-flex flex-column"
                                                            style={{
                                                                rowGap: "0.7rem",
                                                                width: "100%",
                                                                alignItems: "stretch"
                                                            }}
                                                        >

                                                            <h4
                                                                className="fw-bold"
                                                                style={{
                                                                    minHeight: "78px",
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
                                                                {activity.activity_name}
                                                            </h4>

                                                            <div
                                                                style={{
                                                                    color: "#006664",
                                                                    fontSize: "0.92rem",
                                                                    fontWeight: 700,
                                                                    lineHeight: 1.5,
                                                                    letterSpacing: "0.01em",
                                                                    minHeight: "24px",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "0.55rem"
                                                                }}
                                                            >
                                                                <FaCalendarAlt style={{ fontSize: "0.9rem" }} />
                                                                <span>{formatDate(activity.activity_date)}</span>
                                                            </div>

                                                            <div
                                                                style={{
                                                                    color: "#006664",
                                                                    fontSize: "0.9rem",
                                                                    fontWeight: 600,
                                                                    lineHeight: 1.5,
                                                                    letterSpacing: "0.01em",
                                                                    minHeight: "24px",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "0.55rem"
                                                                }}
                                                            >
                                                                <FaClock style={{ fontSize: "0.9rem" }} />
                                                                <span>
                                                                    {activity.start_time && activity.end_time
                                                                        ? `${activity.start_time.substring(0, 5)} - ${activity.end_time.substring(0, 5)} น.`
                                                                        : "เวลาไม่ระบุ"}
                                                                </span>
                                                            </div>

                                                            <p
                                                                className="text-muted"
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
                                                                <span>{activity.location_name}</span>
                                                            </p>

                                                            <Link
                                                                to="/gallery"
                                                                className="btn btn-success rounded-pill px-4 mt-auto"
                                                                style={{
                                                                    alignSelf: "stretch",
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    minHeight: "42px",
                                                                    fontWeight: 700,
                                                                    letterSpacing: "0.02em",
                                                                    marginTop: "0.5rem",
                                                                    width: "100%"
                                                                }}
                                                            >
                                                                ดูรายละเอียด →
                                                            </Link>

                                                        </div>

                                                    </div>

                                                </div>

                                            ))

                                        }

                                    </div>

                                )

                    }

                </div>

            </section>

            <section className="home-activities-section home-upcoming-section">
                <div className="container-fluid home-activities-container">
                    <div className="text-center mb-5">
                        <h2 className="fw-bold mt-3 home-activities-title">
                            กิจกรรมที่กำลังจะเกิดขึ้น
                        </h2>
                        <p className="text-muted">
                            เตรียมพบกับกิจกรรมที่กำลังจะมาถึงของชมรม
                        </p>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-success" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : upcomingActivities.length === 0 ? (
                        <div className="text-center py-5">
                            <h4 className="fw-bold">ยังไม่มีกิจกรรมที่กำลังจะมาถึง</h4>
                            <p className="text-muted mb-0">ติดตามข่าวสารกิจกรรมใหม่ได้เร็ว ๆ นี้</p>
                        </div>
                    ) : (
                        <div className="row g-4 home-activities-row">
                            {upcomingActivities.map((activity) => (
                                <div
                                    className="col-lg-4 col-md-6"
                                    key={activity.activity_id}
                                >
                                    <div className="card h-100 border-0 shadow-lg activity-card">
                                        <div className="home-upcoming-card-accent" />
                                        <div className="card-body p-4 d-flex flex-column gap-3">
                                            <span className="home-upcoming-badge">
                                                {String(activity.activity_date).slice(0, 10) ===
                                                getLocalDate(new Date())
                                                    ? "วันนี้"
                                                    : "เร็ว ๆ นี้"}
                                            </span>
                                            <h3 className="fw-bold home-upcoming-name">
                                                {activity.activity_name}
                                            </h3>
                                            <div className="home-upcoming-meta">
                                                <FaCalendarAlt />
                                                <span>{formatDate(activity.activity_date)}</span>
                                            </div>
                                            <div className="home-upcoming-meta">
                                                <FaClock />
                                                <span>
                                                    {activity.start_time
                                                        ? `${String(activity.start_time).slice(0, 5)}${activity.end_time
                                                            ? ` - ${String(activity.end_time).slice(0, 5)}`
                                                            : ""} น.`
                                                        : "เวลาไม่ระบุ"}
                                                </span>
                                            </div>
                                            <div className="home-upcoming-meta">
                                                <FaMapMarkerAlt />
                                                <span>{activity.location_name || "สถานที่ไม่ระบุ"}</span>
                                            </div>
                                            {activity.description && (
                                                <p className="home-upcoming-description">
                                                    {activity.description}
                                                </p>
                                            )}
                                            <Link
                                                to={`/gallery/${activity.activity_id}`}
                                                className="btn btn-success rounded-pill px-4 mt-auto"
                                            >
                                                ดูรายละเอียด →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <ActivityHistoryMap
                activities={pastActivities}
                formatDate={formatDate}
            />
            <div className="activity-map-link-wrap">
                <Link to="/activity-map" className="btn btn-success rounded-pill px-4">
                    Open Full Activity Map →
                </Link>
            </div>

            <GalleryPreview />
        </>

    );

}

export default Home;