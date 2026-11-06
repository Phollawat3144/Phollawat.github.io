// จุดประสงค์: แสดงพื้นที่ฮีโร่และสไลด์กิจกรรมเด่นบนหน้าแรก
import "../../assets/css/hero.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaArrowRight, FaCalendarAlt, FaImages, FaMapMarkerAlt } from "react-icons/fa";
import api from "../../services/api";

const API_URL = "http://localhost:5000";

function Hero() {

    // สถานะและข้อมูลที่คอมโพเนนต์ใช้

    const [slides, setSlides] = useState([]);
    const [current, setCurrent] = useState(0);

    const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

    // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {

        if (slides.length === 0) return;

        const timer = setInterval(() => {

            setCurrent((prev) => (prev + 1) % slides.length);

        }, 6500);

        return () => clearInterval(timer);

    }, [slides]);

    const loadData = async () => {

        try {

            const res = await api.get("/activities");

            if (res.data.success) {
                const imageSlides = res.data.data.filter(
                    item => Boolean(item.activity_image)
                );

                setSlides(shuffle(imageSlides).slice(0, 6));
                setCurrent(0);
            }

        } catch (err) {

            console.log(err);

        }

    };

    if (slides.length === 0) {
        return <section className="hero hero-empty" aria-label="ภาพกิจกรรม" />;
    }

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (

        <section className="hero">

            {slides.map((item, index) => (

                <div
                    key={item.activity_id}
                    className={`hero-slide ${index === current ? "active" : ""}`}
                >

                    {/* พื้นหลังเบลอ */}
                    <div
                        className="hero-bg"
                        style={{
                            backgroundImage: `url(${API_URL}${item.activity_image})`
                        }}
                    />

                    {/* รูปจริง */}
                    <img
                        src={`${API_URL}${item.activity_image}`}
                        alt={item.activity_name}
                        className="hero-image"
                    />

                    <div className="overlay hero-data-overlay">
                        <div className="container">
                            <div className="hero-site-label">
                                KU CSC Nisit<br />
                                Activities<br />
                                Photo
                            </div>

                            <div className="hero-activity-heading">
                                <span>กิจกรรมล่าสุด</span>
                                <h2>{item.activity_name}</h2>
                            </div>

                            <div className="hero-info-bar">
                                <div className="hero-info-item">
                                    <FaCalendarAlt />
                                    <span>
                                        <small>วันที่จัดกิจกรรม</small>
                                        {item.activity_date
                                            ? new Date(item.activity_date).toLocaleDateString("th-TH", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric"
                                            })
                                            : "กิจกรรมล่าสุด"}
                                    </span>
                                </div>

                                <div className="hero-info-item hero-location-item">
                                    <FaMapMarkerAlt />
                                    <span>
                                        <small>สถานที่</small>
                                        {item.location_name || "KU CSC"}
                                    </span>
                                </div>

                                <div className="hero-info-item">
                                    <FaImages />
                                    <span>
                                        <small>ภาพในอัลบั้ม</small>
                                        {item.images?.length || 0} รูป
                                    </span>
                                </div>

                                <Link to="/gallery" className="hero-info-action">
                                    ดูภาพทั้งหมด <FaArrowRight />
                                </Link>
                            </div>
                        </div>
                    </div>

                </div>

            ))}

            <div className="hero-dots" aria-label="ตัวเลือกสไลด์">
                {slides.map((item, index) => (
                    <button
                        key={item.activity_id}
                        type="button"
                        className={index === current ? "active" : ""}
                        onClick={() => setCurrent(index)}
                        aria-label={`ไปยังสไลด์ที่ ${index + 1}`}
                    />
                ))}
            </div>

        </section>

    );

}

export default Hero;
