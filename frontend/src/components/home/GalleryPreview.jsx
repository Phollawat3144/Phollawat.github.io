// จุดประสงค์: โหลดและแสดงตัวอย่างแกลเลอรีบนหน้าแรก พร้อมการเลื่อนดูภาพ
import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import "../../assets/css/galleryPreview.css";

const API_URL = "http://localhost:5000";

const shuffle = (items) => {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled;
};

function GalleryPreview() {

    // สถานะและข้อมูลที่คอมโพเนนต์ใช้

    const [images, setImages] = useState([]);
    const sliderRef = useRef(null);

    // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์

    useEffect(() => {
        const loadGallery = async () => {
            try {
                const res = await api.get("/activities");
                if (!res.data.success) return;

                const gallery = [];
                res.data.data.forEach((activity) => {
                    if (Array.isArray(activity.images)) {
                        activity.images.forEach((img) => {
                            gallery.push({
                                image: img.image_path,
                                title: activity.activity_name,
                                subtitle: activity.location_name || "Photo Club"
                            });
                        });
                    }
                });

                setImages(shuffle(gallery));
            } catch (err) {
                console.log(err);
            }
        };

        loadGallery();
    }, []);

    // จัดการเหตุการณ์และการเปลี่ยนแปลงข้อมูล
    const scrollGallery = (direction) => {
        const slider = sliderRef.current;

        if (!slider) return;

        const firstItem = slider.querySelector(".gallery-item");
        const gap = Number.parseFloat(window.getComputedStyle(slider).columnGap) || 0;
        const cardWidth = firstItem ? firstItem.getBoundingClientRect().width + gap : 280;

        slider.scrollBy({
            left: direction * cardWidth,
            behavior: "smooth"
        });
    };

    useEffect(() => {
        if (images.length < 2) return undefined;

        const intervalId = window.setInterval(() => {
            const slider = sliderRef.current;
            if (!slider) return;

            const firstItem = slider.querySelector(".gallery-item");
            const gap = Number.parseFloat(window.getComputedStyle(slider).columnGap) || 0;
            const cardWidth = firstItem ? firstItem.getBoundingClientRect().width + gap : 280;
            const atEnd = slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 8;

            if (atEnd) {
                slider.scrollTo({ left: 0, behavior: "smooth" });
            } else {
                slider.scrollBy({ left: cardWidth, behavior: "smooth" });
            }
        }, 3000);

        return () => window.clearInterval(intervalId);
    }, [images.length]);

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (

        <section className="gallery-preview showcase-section">

            <div className="showcase-shell">

                <div className="showcase-heading">
                    <div>
                        <h2>ภาพความประทับใจ</h2>
                        <p>รวมช่วงเวลาจากกิจกรรมของ KU CSC Nisit</p>
                    </div>

                    {images.length > 0 && (
                        <div className="showcase-controls">
                            <button
                                type="button"
                                className="gallery-nav-btn"
                                aria-label="ภาพก่อนหน้า"
                                onClick={() => scrollGallery(-1)}
                            >
                                <span className="arrow left" aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                className="gallery-nav-btn"
                                aria-label="ภาพถัดไป"
                                onClick={() => scrollGallery(1)}
                            >
                                <span className="arrow right" aria-hidden="true" />
                            </button>
                        </div>
                    )}
                </div>

                {images.length > 0 ? (
                    <div className="showcase-center">
                        <div className="gallery-slider" ref={sliderRef}>
                            {images.map((item) => (
                                <article
                                    className="gallery-item"
                                    key={`${item.image}-${item.title}`}
                                >
                                    <img
                                        src={`${API_URL}${item.image}`}
                                        alt={item.title}
                                        loading="lazy"
                                    />

                                    <div className="gallery-label">
                                        <span>{item.title}</span>
                                        <small>{item.subtitle}</small>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="showcase-empty">
                        ยังไม่มีรูปภาพกิจกรรมในขณะนี้
                    </div>
                )}

            </div>

        </section>

    );

}

export default GalleryPreview;
