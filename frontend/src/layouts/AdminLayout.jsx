// จุดประสงค์: จัดโครงหน้าผู้ดูแลระบบและองค์ประกอบนำทางที่ใช้ร่วมกัน
import Sidebar from "../components/layout/Sidebar";
import { useLocation } from "react-router-dom";

const pageTitles = [
    { match: "/dashboard/activities/new", title: "เพิ่มกิจกรรม" },
    { match: "/dashboard/activities/edit", title: "แก้ไขกิจกรรม" },
    { match: "/dashboard/activities", title: "จัดการกิจกรรม" },
    { match: "/dashboard/locations/new", title: "เพิ่มสถานที่" },
    { match: "/dashboard/locations/edit", title: "แก้ไขสถานที่" },
    { match: "/dashboard/locations", title: "จัดการสถานที่" },
    { match: "/dashboard/members", title: "จัดการสมาชิก" },
    { match: "/dashboard/gallery/", title: "รายละเอียดอัลบั้ม" },
    { match: "/dashboard/gallery", title: "จัดการแกลเลอรี" },
    { match: "/dashboard/profile", title: "ข้อมูลส่วนตัว" },
    { match: "/dashboard", title: "แดชบอร์ดผู้ดูแลระบบ" },
];

function AdminLayout({ children }) {
    const { pathname } = useLocation();
    const pageTitle = pageTitles.find((page) => pathname.startsWith(page.match))?.title || "ระบบผู้ดูแล";

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (
        <div
            className="member-layout"
            style={{
                background: "#F5F7FB",
                minHeight: "100vh"
            }}
        >

            {/* =========================================
                ADMIN SIDEBAR
            ========================================= */}

            <Sidebar />


            {/* =========================================
                MAIN CONTENT
            ========================================= */}

            <div className="member-layout-content">

                <div className="container-fluid member-page-shell p-3 p-lg-4">

                    <div className="admin-dashboard-heading mb-4">
                        <div>
                            <h1 className="admin-dashboard-title">{pageTitle}</h1>
                        </div>
                    </div>

                    {children}

                </div>

            </div>

        </div>
    );
}

export default AdminLayout;
