// จุดประสงค์: จัดการรายการภาพสมาชิกและการรีเฟรชข้อมูลภาพ
import { useState } from "react";
import Swal from "sweetalert2";
import api from "../../services/api";

function PhotoManager({ photos = [], onRefresh }) {
    // สถานะและข้อมูลที่คอมโพเนนต์ใช้
    const [deleting, setDeleting] = useState(null);

    // จัดการเหตุการณ์และการเปลี่ยนแปลงข้อมูล

    const handleDelete = async (id) => {
        const ok = await Swal.fire({ title: 'ยืนยันการลบ', text: 'คุณต้องการลบภาพนี้หรือไม่?', showCancelButton: true, confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก' });
        if (!ok.isConfirmed) return;
        setDeleting(id);
        try {
            await api.delete(`/uploads/${id}`);
            Swal.fire({ icon: 'success', title: 'ลบแล้ว', timer: 1000, showConfirmButton: false });
            onRefresh && onRefresh();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'ล้มเหลว', text: err.response?.data?.message || err.message });
        } finally {
            setDeleting(null);
        }
    };

    if (!photos || photos.length === 0) return (
        <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-body text-center text-muted">ยังไม่มีรูปภาพ</div>
        </div>
    );

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (
        <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-0">
                <h5 className="fw-bold mb-0">จัดการรูปภาพ</h5>
            </div>
            <div className="card-body">
                <div className="row g-3">
                    {photos.map((p) => (
                        <div key={p.upload_id || p.id} className="col-md-3">
                            <div className="card h-100">
                                <img src={p.path ? `http://localhost:5000${p.path}` : (p.url || '')} alt="photo" style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                                <div className="card-body d-flex justify-content-between align-items-center">
                                    <small className="text-muted">{p.caption || ''}</small>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.upload_id || p.id)} disabled={deleting === (p.upload_id || p.id)}>{deleting === (p.upload_id || p.id) ? '...' : 'ลบ'}</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default PhotoManager;
