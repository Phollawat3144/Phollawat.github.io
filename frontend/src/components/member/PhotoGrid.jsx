// จุดประสงค์: จัดเรียงภาพสมาชิกเป็นกริดและส่งต่อการเลือกภาพ
import React from "react";

function PhotoGrid({ photos = [], onImageClick }) {
    if (!photos.length) {
        return (
            <div className="card border-0 shadow-sm rounded-4 mt-4">
                <div className="card-header bg-white border-0">
                    <h5 className="fw-bold mb-0">Latest Photos</h5>
                </div>
                <div className="card-body">
                    <div className="col-12 text-center text-muted py-5">
                        ยังไม่มีรูปภาพ
                    </div>
                </div>
            </div>
        );
    }

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (
        <div className="card border-0 shadow-sm rounded-4 mt-4">
            <div className="card-header bg-white border-0">
                <h5 className="fw-bold mb-0">Latest Photos</h5>
            </div>
            <div className="card-body">
                <div className="row">
                    {photos.map((photo, index) => (
                        <div key={photo.image_id} className="col-lg-3 col-md-4 col-6 mb-3">
                            <div
                                className="position-relative overflow-hidden rounded-4 shadow-sm"
                                style={{ cursor: onImageClick ? "pointer" : "default" }}
                                onClick={() => onImageClick?.(index)}
                            >
                                <img
                                    src={`http://localhost:5000${photo.image_path}`}
                                    alt=""
                                    className="img-fluid"
                                    style={{
                                        width: "100%",
                                        height: 200,
                                        objectFit: "cover"
                                    }}
                                />
                                <div
                                    className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-end justify-content-start p-2"
                                    style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.4) 100%)" }}
                                >
                                    <span className="badge bg-light text-dark">Zoom</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default PhotoGrid;
