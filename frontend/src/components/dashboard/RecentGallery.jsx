// จุดประสงค์: แสดงภาพหรือกิจกรรมในแกลเลอรีล่าสุดบนแดชบอร์ด
const API_URL = "http://localhost:5000";

function RecentGallery({ activities = [] }) {

    const images = [];

    activities.forEach((activity) => {

        activity.images?.forEach((img) => {

            images.push({

                path: img.image_path,

                title: activity.activity_name

            });

        });

    });

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (

        <div
            className="card border-0 shadow-sm rounded-4 h-100"
        >

            <div className="card-body">

                <div className="d-flex justify-content-between align-items-center mb-4">

                    <h5 className="fw-bold mb-0">

                        🖼 รูปล่าสุด

                    </h5>

                    <small className="text-muted">

                        {images.length} รูป

                    </small>

                </div>

                {

                    images.length === 0 ?

                        (

                            <div
                                className="d-flex justify-content-center align-items-center"
                                style={{ height: "220px" }}
                            >

                                <p className="text-muted mb-0">

                                    ยังไม่มีรูปภาพ

                                </p>

                            </div>

                        )

                        :

                        (

                            <div className="row g-3">

                                {

                                    images.slice(0, 8).map((img, index) => (

                                        <div
                                            className="col-3"
                                            key={index}
                                        >

                                            <img

                                                src={`${API_URL}${img.path}`}

                                                alt={img.title}

                                                className="img-fluid gallery-thumb"

                                                style={{

                                                    width: "100%",

                                                    height: "90px",

                                                    objectFit: "cover",

                                                    borderRadius: "14px",

                                                    cursor: "pointer",

                                                    transition: ".35s"

                                                }}

                                                onMouseEnter={(e) => {

                                                    e.currentTarget.style.transform = "scale(1.08)";

                                                    e.currentTarget.style.boxShadow =
                                                        "0 10px 25px rgba(0,0,0,.18)";

                                                }}

                                                onMouseLeave={(e) => {

                                                    e.currentTarget.style.transform = "scale(1)";

                                                    e.currentTarget.style.boxShadow = "none";

                                                }}

                                            />

                                        </div>

                                    ))

                                }

                            </div>

                        )

                }

            </div>

        </div>

    );

}

export default RecentGallery;
