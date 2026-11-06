// จุดประสงค์: โหลดและแสดงรายการกิจกรรมล่าสุดบนหน้าแรก
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "../../assets/css/latestActivities.css";

const API_URL = "http://localhost:5000";

function LatestActivities() {

    // สถานะและข้อมูลที่คอมโพเนนต์ใช้

    const [activities, setActivities] = useState([]);

    // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์

    useEffect(() => {
        loadActivities();
    }, []);

    const loadActivities = async () => {

        try {

            const res = await api.get("/activities");

            if (res.data.success) {

                setActivities(res.data.data.slice(0, 3));

            }

        } catch (err) {

            console.log(err);

        }

    };

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (

        <section className="latest-section">

            <div className="container">

                <div className="section-header">

                    <span>Latest Activities</span>

                    <h2>กิจกรรมล่าสุด</h2>

                    <p>

                        รวมภาพกิจกรรมและเรื่องราวล่าสุดของชมรมถ่ายภาพ

                    </p>

                </div>

                <div className="row g-4">

                    {

                        activities.map(item => (

                            <div
                                className="col-lg-4"
                                key={item.activity_id}
                            >

                                <div className="activity-card">

                                    <div className="activity-image">

                                        <img

                                            src={
                                                item.activity_image
                                                    ? `${API_URL}${item.activity_image}`
                                                    : "https://placehold.co/600x400"
                                            }

                                            alt={item.activity_name}

                                        />

                                    </div>

                                    <div className="activity-content">

                                        <small>

                                            เนยโ€โ€ฆ {item.activity_date}

                                        </small>

                                        <h3>

                                            {item.activity_name}

                                        </h3>

                                        <p>

                                            เนยโ€ย {item.location_name}

                                        </p>

                                        <Link
                                            to="/activities"
                                            className="read-more"
                                        >

                                            Read More เนยโ€

                                        </Link>

                                    </div>

                                </div>

                            </div>

                        ))

                    }

                </div>

            </div>

        </section>

    );

}

export default LatestActivities;
