// จุดประสงค์: แสดงแถบด้านบนของหน้าผู้ดูแลระบบ
import { useNavigate } from "react-router-dom";
import { FaCloudUploadAlt } from "react-icons/fa";

function AdminTopbar() {
    const navigate = useNavigate();

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (
        <div className="member-topbar-shell bg-white shadow-sm rounded-4 px-4 py-3 mb-4">
            <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
                <div className="flex-grow-1 min-w-0">
                    <h4 className="fw-bold mb-1">Admin Dashboard</h4>
                    <small className="text-muted">Welcome back, Administrator เนยโ€ย</small>
                </div>

                <button
                    className="member-topbar-add-btn btn btn-success rounded-3 d-flex align-items-center fw-bold"
                    onClick={() => navigate("/dashboard/activities/new")}
                >
                    <FaCloudUploadAlt className="me-2" /> สร้างกิจกรรม
                </button>
            </div>
        </div>
    );
}

export default AdminTopbar;
