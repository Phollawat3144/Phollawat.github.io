// จุดประสงค์: แสดงการ์ดสถิติพร้อมไอคอนและรูปแบบตามประเภทข้อมูล
import {
    FaCalendarAlt,
    FaUsers,
    FaImages,
    FaNewspaper,
    FaMapMarkerAlt
} from "react-icons/fa";

function StatCard({ title, value, color, columns = 3 }) {

    const normalizedTitle = title?.toString().trim().toLowerCase();

    const icons = {
        activities: <FaCalendarAlt size={34} />,
        "กิจกรรม": <FaCalendarAlt size={34} />,
        members: <FaUsers size={34} />,
        "สมาชิก": <FaUsers size={34} />,
        gallery: <FaImages size={34} />,
        "แกลเลอรี": <FaImages size={34} />,
        news: <FaNewspaper size={34} />,
        "ข่าว": <FaNewspaper size={34} />,
        "รูปภาพ": <FaImages size={34} />,
        "ตำแหน่ง": <FaMapMarkerAlt size={34} />,
        "เดือนนี้": <FaCalendarAlt size={34} />
    };

    const backgrounds = {
        success: "linear-gradient(135deg,#006664,#006664)",
        primary: "linear-gradient(135deg,#2563eb,#3b82f6)",
        warning: "linear-gradient(135deg,#f59e0b,#fbbf24)",
        danger: "linear-gradient(135deg,#dc2626,#ef4444)"
    };

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (

        <div className={`col-lg-${columns} col-md-6`}>

            <div

                className="text-white p-4 h-100"

                style={{

                    borderRadius: "24px",

                    background: backgrounds[color],

                    boxShadow: "0 18px 35px rgba(0,0,0,.12)",

                    transition: ".35s",

                    cursor: "pointer"

                }}

                onMouseEnter={(e) => {

                    e.currentTarget.style.transform = "translateY(-8px)";

                }}

                onMouseLeave={(e) => {

                    e.currentTarget.style.transform = "translateY(0)";

                }}

            >

                <div className="d-flex justify-content-between align-items-center">

                    <div>

                        <h6 className="mb-2" style={{ color: "#fff", opacity: 0.9, transform: "none", fontStyle: "normal", letterSpacing: "normal" }}>

                            {title}

                        </h6>

                        <h1 className="fw-bold mb-0" style={{ color: "#fff", transform: "none", fontStyle: "normal", letterSpacing: "normal" }}>

                            {value}

                        </h1>

                    </div>

                    <div
                        style={{
                            fontSize: "34px",
                            opacity: .25
                        }}
                    >

                        {icons[normalizedTitle]}

                    </div>

                </div>

                <hr
                    style={{
                        borderColor: "rgba(255,255,255,.2)"
                    }}
                />

                <small style={{ color: "#fff", opacity: 0.8, transform: "none", fontStyle: "normal", letterSpacing: "normal" }}>

                    ข้อมูลล่าสุดของระบบ

                </small>

            </div>

        </div>

    );

}

export default StatCard;
