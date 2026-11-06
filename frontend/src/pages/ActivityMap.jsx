import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ActivityHistoryMap from "../components/map/ActivityHistoryMap";
import api from "../services/api";

const getLocalDate = (date) => [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
].join("-");

function ActivityMap() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        const loadPastActivities = async () => {
            try {
                const response = await api.get("/activities");
                if (!response.data.success) {
                    throw new Error(response.data.message || "โหลดกิจกรรมไม่สำเร็จ");
                }

                const now = new Date();
                const today = getLocalDate(now);
                const currentTime = [
                    String(now.getHours()).padStart(2, "0"),
                    String(now.getMinutes()).padStart(2, "0")
                ].join(":");
                const pastActivities = (Array.isArray(response.data.data) ? response.data.data : [])
                    .filter((activity) => {
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
                    })
                    .sort((first, second) =>
                        String(second.activity_date).localeCompare(String(first.activity_date)) ||
                        String(second.start_time || "").localeCompare(String(first.start_time || ""))
                    );

                setActivities(pastActivities);
            } catch (error) {
                console.error("loadPastActivities error:", error);
                setLoadError(true);
            } finally {
                setLoading(false);
            }
        };

        loadPastActivities();
    }, []);

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("th-TH", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    };

    return (
        <div className="activity-map-page">
            {loading ? (
                <div className="text-center py-5" role="status">
                    <div className="spinner-border text-success" />
                    <span className="visually-hidden">กำลังโหลดแผนที่...</span>
                </div>
            ) : loadError ? (
                <div className="activity-history-empty" role="alert">
                    โหลดข้อมูลกิจกรรมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
                </div>
            ) : (
                <ActivityHistoryMap
                    activities={activities}
                    formatDate={formatDate}
                />
            )}
        </div>
    );
}

export default ActivityMap;
