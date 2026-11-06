// จุดประสงค์: จัดโครงหน้าสมาชิกพร้อมเมนูและพื้นที่เนื้อหา
import MemberSidebar from "../components/layout/MemberSidebar";
import { useLocation } from "react-router-dom";

const pageTitles = [
    { match: "/member/profile", title: "ข้อมูลส่วนตัว" },
    { match: "/member/upload", title: "อัปโหลดภาพกิจกรรม" },
    { match: "/member/gallery/", title: "รายละเอียดรูปภาพ" },
    { match: "/member/gallery", title: "รูปภาพที่อัปโหลด" },
    { match: "/member", title: "แดชบอร์ดสมาชิก" },
];

function MemberLayout({ children }) {
    const { pathname } = useLocation();
    const pageTitle = pageTitles.find((page) => pathname.startsWith(page.match))?.title || "พื้นที่สมาชิก";

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (
        <div
            className="member-layout"
            style={{
                background: "#F5F7FB",
                minHeight: "100vh"
            }}
        >
            <MemberSidebar />

            <div className="member-layout-content">
                <div className="container-fluid member-page-shell p-3 p-lg-4">
                    <div className="admin-dashboard-heading mb-4">
                        <h1 className="admin-dashboard-title">{pageTitle}</h1>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}

export default MemberLayout;
