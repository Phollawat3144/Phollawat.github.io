// จุดประสงค์: แสดงข้อมูลกิจกรรมในตารางพร้อมการจัดการรายการ
import { FaMapMarkerAlt, FaCalendarAlt, FaClock } from "react-icons/fa";

const API_URL = "http://localhost:5000";

function ActivityTable({ activities }) {

    const formatDate = (date) => {

        if (!date) return "-";

        return new Date(date).toLocaleDateString("th-TH", {

            day: "numeric",
            month: "short",
            year: "numeric"

        });

    };

    const formatTime = (time) => time ? time.substring(0, 5) : "-";

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (

        <div
            className="card border-0"
            style={{

                borderRadius: "24px",

                overflow: "hidden",

                boxShadow: "0 15px 35px rgba(0,0,0,.08)"

            }}
        >

            <div
                className="card-header bg-white py-4"
                style={{

                    borderBottom: "1px solid #eee"

                }}
            >

                <h5 className="fw-bold mb-0">

                    📅 กิจกรรมล่าสุด

                </h5>

            </div>

            <div className="table-responsive">

                <table className="table align-middle mb-0">

                    <thead
                        style={{
                            background: "#F8FAFC"
                        }}
                    >

                        <tr>

                            <th width="70">

                                #

                            </th>

                            <th width="90">

                                รูป

                            </th>

                            <th>

                                กิจกรรม

                            </th>

                            <th>

                                วันที่

                            </th>

                            <th>

                                สถานที่

                            </th>

                            <th>
                                เวลา
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            activities.length === 0 ?

                                (

                                    <tr>

                                        <td
                                            colSpan="6"
                                            className="text-center py-5"
                                        >

                                            ไม่พบข้อมูล

                                        </td>

                                    </tr>

                                )

                                :

                                (

                                    activities.map((item, index) => (

                                        <tr
                                            key={item.activity_id}
                                        >

                                            <td>

                                                <strong>

                                                    {index + 1}

                                                </strong>

                                            </td>

                                            <td>

                                                <img

                                                    src={
                                                        item.activity_image
                                                            ? `${API_URL}${item.activity_image}`
                                                            : "https://placehold.co/80x80?text=No+Image"
                                                    }

                                                    alt={item.activity_name}

                                                    style={{

                                                        width: "65px",

                                                        height: "65px",

                                                        objectFit: "cover",

                                                        borderRadius: "14px"

                                                    }}

                                                />

                                            </td>

                                            <td>

                                                <div className="fw-bold">

                                                    {item.activity_name}

                                                </div>

                                            </td>

                                            <td>

                                                <FaCalendarAlt
                                                    className="text-success me-2"
                                                />

                                                {formatDate(item.activity_date)}

                                            </td>

                                            <td>

                                                <FaMapMarkerAlt
                                                    className="text-danger me-2"
                                                />

                                                {item.location_name}

                                            </td>

                                            <td>
                                                <FaClock className="text-success me-2" />
                                                {formatTime(item.start_time)} - {formatTime(item.end_time)} น.
                                            </td>

                                        </tr>

                                    ))

                                )

                        }

                    </tbody>

                </table>

            </div>

        </div>

    );

}

export default ActivityTable;
