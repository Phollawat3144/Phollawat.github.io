// จุดประสงค์: รับไฟล์ภาพสมาชิกและส่งข้อมูลการอัปโหลด
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../../services/api";

function UploadModal({ show, onClose, onUploaded }) {
    // สถานะและข้อมูลที่คอมโพเนนต์ใช้
    const [activities, setActivities] = useState([]);
    const [selectedActivity, setSelectedActivity] = useState("");
    const [files, setFiles] = useState([]);
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [position, setPosition] = useState(null);
    const [useGps, setUseGps] = useState(false);
    const [loading, setLoading] = useState(false);

    // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get("/activities");
                if (res.data.success) setActivities(res.data.data || []);
            } catch (err) {}
        };
        load();
    }, []);

    // จัดการเหตุการณ์และการเปลี่ยนแปลงข้อมูล
    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files || []));
    };

    const handleUseGps = () => {
        if (!navigator.geolocation) return Swal.fire({ icon: "warning", title: "ไม่รองรับ GPS" });
        setUseGps(true);
        navigator.geolocation.getCurrentPosition((pos) => {
            setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }, () => {
            Swal.fire({ icon: "warning", title: "ไม่สามารถรับตำแหน่ง GPS ได้" });
            setUseGps(false);
        });
    };

    const handleUpload = async () => {
        if (!selectedActivity) return Swal.fire({ icon: "warning", title: "เลือกหัวข้อกิจกรรมก่อน" });
        if (files.length === 0) return Swal.fire({ icon: "warning", title: "เลือกไฟล์ก่อน" });
        setLoading(true);
        try {
            const formData = new FormData();
            files.forEach((f) => formData.append("images", f));
            formData.append("description", description || "");
            formData.append("activity_date", date || "");
            formData.append("start_time", startTime || "");
            formData.append("end_time", endTime || "");
            if (position) {
                formData.append("latitude", position.lat);
                formData.append("longitude", position.lng);
            }

            await api.post(`/gallery/${selectedActivity}/upload`, formData);
            Swal.fire({ icon: "success", title: "อัปโหลดเรียบร้อย", timer: 1200, showConfirmButton: false });
            onUploaded && onUploaded();
            onClose && onClose();
        } catch (err) {
            Swal.fire({ icon: "error", title: "อัปโหลดไม่สำเร็จ", text: err.response?.data?.message || err.message });
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
            <div className="card p-4" style={{ width: 880, borderRadius: 12 }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0">อัปโหลดภาพกิจกรรม</h5>
                    <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>ปิด</button>
                </div>

                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label">เลือกหัวข้อกิจกรรม</label>
                        <select className="form-select" value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)}>
                            <option value="">-- เลือกกิจกรรม --</option>
                            {activities.map(a => (<option key={a.activity_id} value={a.activity_id}>{a.activity_name}</option>))}
                        </select>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">วันที่</label>
                        <input type="date" className="form-control" value={date} onChange={(e)=>setDate(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">เวลาเริ่ม</label>
                        <input type="time" className="form-control" value={startTime} onChange={(e)=>setStartTime(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">เวลาจบ</label>
                        <input type="time" className="form-control" value={endTime} onChange={(e)=>setEndTime(e.target.value)} />
                    </div>
                    <div className="col-12">
                        <label className="form-label">คำอธิบาย</label>
                        <textarea className="form-control" rows={3} value={description} onChange={(e)=>setDescription(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">เลือกรูปภาพ</label>
                        <input type="file" accept="image/jpeg,image/jpg" multiple className="form-control" onChange={handleFileChange} />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">ตำแหน่งกิจกรรม</label>
                        <div className="d-flex gap-2">
                            <button className="btn btn-outline-success" onClick={handleUseGps}>{useGps ? 'ใช้ GPS (ถูกตั้ง)' : 'ใช้ GPS อัตโนมัติ'}</button>
                            <button className="btn btn-outline-secondary" onClick={()=>Swal.fire('แผนที่', 'ฟีเจอร์เลือกตำแหน่งบนแผนที่จะเพิ่มในภายหลัง')}>เลือกบนแผนที่</button>
                        </div>
                        {position && (<div className="mt-2"><small className="text-muted">Lat: {position.lat.toFixed(5)}, Lng: {position.lng.toFixed(5)}</small></div>)}
                    </div>
                </div>

                <div className="mt-3 d-flex justify-content-end gap-2">
                    <button className="btn btn-outline-secondary" onClick={onClose}>ยกเลิก</button>
                    <button className="btn btn-success" onClick={handleUpload} disabled={loading}>{loading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}</button>
                </div>
            </div>
        </div>
    );
}

export default UploadModal;
