// จุดประสงค์: ค้นหาและจัดการอัลบั้มในแกลเลอรีของผู้ดูแลระบบ
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    FaSearch,
    FaCalendarAlt,
    FaClock,
    FaMapMarkerAlt,
    FaImages,
    FaArrowRight
} from "react-icons/fa";

import AdminLayout from "../../layouts/AdminLayout";
import api from "../../services/api";

function Gallery() {

    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadGallery();
    }, []);

    const loadGallery = async () => {

        try {

            const res = await api.get("/gallery");

            setAlbums(res.data.data || []);

        } catch (err) {

            console.log(err);

        } finally {

            setLoading(false);

        }

    };

    const formatDate = (date) => {

        if (!date) return "-";

        return new Date(date).toLocaleDateString("th-TH", {

            day: "numeric",
            month: "long",
            year: "numeric"

        });

    };

    const filtered = albums.filter(item => {
        const keyword = search.toLowerCase();
        const activity = item.activity_name?.toLowerCase() || "";
        const location = item.location_name?.toLowerCase() || "";
        const dateText = formatDate(item.activity_date).toLowerCase();

        return (
            activity.includes(keyword) ||
            location.includes(keyword) ||
            dateText.includes(keyword)
        );
    });

    return (

        <AdminLayout>

            {/* Search */}

            <div
                className="mx-auto mb-5"
                style={{
                    maxWidth: 700
                }}
            >

                <div className="input-group shadow-sm">

                    <span className="input-group-text bg-white border-end-0">

                        <FaSearch />

                    </span>

                    <input

                        className="form-control border-start-0"

                        placeholder="ค้นหาชื่อกิจกรรม วันที่ หรือสถานที่..."

                        value={search}

                        onChange={(e) => setSearch(e.target.value)}

                        style={{

                            height: 58,
                            fontSize: 18,
                            borderRadius: 15

                        }}

                    />

                </div>

            </div>

            {

                loading ?

                    (

                        <div className="text-center py-5">

                            <div className="spinner-border text-success"></div>

                        </div>

                    )

                    :

                    (

                        <div className="row g-4">

                            {

                                filtered.map(album => (

                                    <div

                                        className="col-xl-4 col-lg-4 col-md-6"

                                        key={album.activity_id}

                                    >

                                        <Link

                                            to={`/dashboard/gallery/${album.activity_id}`}

                                            style={{
                                                textDecoration: "none",
                                                color: "inherit"

                                            }}

                                        >

                                            <div

                                                className="card border-0 shadow h-100"

                                                style={{

                                                    borderRadius: 22,
                                                    overflow: "hidden",
                                                    transition: ".35s"

                                                }}

                                                onMouseEnter={(e) => {

                                                    e.currentTarget.style.transform =
                                                        "translateY(-8px)";

                                                    e.currentTarget.style.boxShadow =
                                                        "0 20px 40px rgba(0,0,0,.15)";

                                                }}

                                                onMouseLeave={(e) => {

                                                    e.currentTarget.style.transform =
                                                        "translateY(0)";

                                                    e.currentTarget.style.boxShadow = "";

                                                }}

                                            >

                                                <div
                                                    style={{
                                                        position: "relative",
                                                        width: "100%",
                                                        paddingBottom: "72%",
                                                        overflow: "hidden",
                                                        background: "#f5f5f5"
                                                    }}
                                                >
                                                    {album.cover_image && (
                                                        <img
                                                            src={`http://localhost:5000${album.cover_image}`}
                                                            alt={album.activity_name}
                                                            onError={(event) => {
                                                                event.currentTarget.style.display = "none";
                                                                event.currentTarget.nextElementSibling.style.display = "flex";
                                                            }}
                                                            style={{
                                                                position: "absolute",
                                                                top: 0,
                                                                left: 0,
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit: "cover",
                                                                objectPosition: "center",
                                                                transition: ".35s ease"
                                                            }}
                                                        />
                                                    )}

                                                    <div
                                                        style={{
                                                            display: album.cover_image ? "none" : "flex",
                                                            position: "absolute",
                                                            inset: 0,
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            background: "#f1f5f3",
                                                            color: "#006664",
                                                            fontSize: 56
                                                        }}
                                                    >
                                                        <FaImages />
                                                    </div>
                                                </div>

                                                <div className="card-body p-4 d-flex flex-column" style={{ paddingTop: "3.5rem" }}>

                                                    <span
                                                        className="badge bg-success rounded-pill px-3 py-2"
                                                        style={{
                                                            position: "absolute",
                                                            left: "1rem",
                                                            bottom: "1rem",
                                                            zIndex: 2,
                                                            boxShadow: "0 8px 18px rgba(0, 102, 100, 0.18)"
                                                        }}
                                                    >
                                                        <FaImages className="me-2" />
                                                        {album.total_images || album.images?.length || 0} รูป
                                                    </span>

                                                    <h4
                                                        className="fw-bold mb-4"
                                                        style={{
                                                            minHeight: 60
                                                        }}
                                                    >

                                                        {album.activity_name}

                                                    </h4>

                                                    <div
                                                        className="d-flex align-items-center mb-3 text-muted"
                                                        style={{ gap: 10 }}
                                                    >

                                                        <FaCalendarAlt
                                                            className="me-1"
                                                            style={{ color: "#006664", fontSize: 18 }}
                                                        />

                                                        <span style={{ color: "#006664", fontWeight: 700 }}>วันที่</span>
                                                        <span style={{ color: "#1f2937", fontWeight: 500 }}>{formatDate(album.activity_date)}</span>

                                                    </div>

                                                    <div
                                                        className="d-flex align-items-center mb-3 text-muted"
                                                        style={{ gap: 10 }}
                                                    >

                                                        <FaClock
                                                            className="me-1"
                                                            style={{ color: "#006664", fontSize: 18 }}
                                                        />

                                                        <span style={{ color: "#006664", fontWeight: 700 }}>เวลา</span>
                                                        <span style={{ color: "#1f2937", fontWeight: 500 }}>
                                                            {album.start_time ? album.start_time.slice(0, 5) : "-"}
                                                            {album.start_time && album.end_time ? ` - ${album.end_time.slice(0, 5)}` : ""}
                                                        </span>

                                                    </div>

                                                    <div
                                                        className="d-flex align-items-start mb-4 text-muted"
                                                        style={{ gap: 10 }}
                                                    >

                                                        <FaMapMarkerAlt
                                                            className="mt-1"
                                                            style={{ color: "#006664", fontSize: 18, flexShrink: 0 }}
                                                        />

                                                        <div
                                                            style={{
                                                                minHeight: 42,
                                                                lineHeight: 1.5,
                                                                color: "#1f2937",
                                                                fontWeight: 500
                                                            }}
                                                        >
                                                            <span style={{ color: "#006664", fontWeight: 700, marginRight: 8 }}>สถานที่</span>
                                                            {album.location_name || "-"}
                                                        </div>

                                                    </div>

                                                    <div className="mt-auto d-flex justify-content-end align-items-center">
                                                        <span
                                                            className="fw-bold text-success"
                                                        >

                                                            ดูอัลบั้ม

                                                            <FaArrowRight className="ms-2" />

                                                        </span>
                                                    </div>

                                                </div>

                                            </div>

                                        </Link>

                                    </div>

                                ))

                            }

                        </div>

                    )

            }

        </AdminLayout>

    );

}

export default Gallery;
