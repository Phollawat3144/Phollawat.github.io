// จุดประสงค์: โหลดและแสดงภาพรวมสถิติและกิจกรรมในแดชบอร์ดผู้ดูแลระบบ
import { useEffect, useState } from "react";
import { FaArrowUp } from "react-icons/fa";
import { Link } from "react-router-dom";

import AdminLayout from "../../layouts/AdminLayout";

import StatCard from "../../components/cards/StatCard";
import ActivityChart from "../../components/dashboard/ActivityChart";
import RecentGallery from "../../components/dashboard/RecentGallery";
import ActivityTable from "../../components/table/ActivityTable";

import api from "../../services/api";


function Dashboard() {

    // สถานะและข้อมูลที่คอมโพเนนต์ใช้

    const [activities, setActivities] = useState([]);

    const [stats, setStats] = useState({
        activities: 0,
        members: 0,
        gallery: 0,
        news: 0
    });


    // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์


    useEffect(() => {

        loadActivities();
        loadDashboard();

    }, []);

    const loadActivities = async () => {

        try {

            const res = await api.get("/activities");

            if (res.data.success) {

                setActivities(res.data.data || []);

            }

        } catch (err) {

            console.log(err);

        }

    };

    const loadDashboard = async () => {

        try {

            const res = await api.get("/dashboard");

            if (res.data.success) {

                setStats(res.data.data);

            }

        } catch (err) {

            console.log(err);

        }

    };

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (

        <AdminLayout>

            {/* Statistics */}

            <div className="row g-3 mb-4">

                <StatCard
                    title="Activities"
                    value={stats.activities}
                    color="success"
                    columns={4}
                />

                <StatCard
                    title="Members"
                    value={stats.members}
                    color="primary"
                    columns={4}
                />

                <StatCard
                    title="Gallery"
                    value={stats.gallery}
                    color="warning"
                    columns={4}
                />

            </div>

            {/* Chart + Gallery */}

            <div className="row g-3 mb-4 admin-dashboard-panels">

                <div className="col-lg-8">

                    <ActivityChart
                        activities={activities}
                    />

                </div>

                <div className="col-lg-4">

                    <RecentGallery
                        activities={activities}
                    />

                </div>

            </div>

            {/* Recent Activities */}

            <div className="card border-0 shadow-sm rounded-4">

                <div className="card-body">

                    <div className="d-flex justify-content-between align-items-center mb-4">

                        <div>

                            <h4 className="fw-bold mb-1">

                                กิจกรรมล่าสุด

                            </h4>

                            <small className="text-muted">

                                รายการกิจกรรมทั้งหมดในระบบ

                            </small>

                        </div>

                        <Link
                            to="/dashboard/activities"
                            className="btn btn-outline-success rounded-pill"
                        >

                            ดูทั้งหมด

                            <FaArrowUp
                                className="ms-2"
                                style={{
                                    transform: "rotate(45deg)"
                                }}
                            />

                        </Link>

                    </div>

                    <ActivityTable
                        activities={activities}
                    />

                </div>

            </div>

        </AdminLayout>

    );

}

export default Dashboard;
