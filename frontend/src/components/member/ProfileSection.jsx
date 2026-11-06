// จุดประสงค์: โหลดและแสดงข้อมูลโปรไฟล์สมาชิก
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../../services/api";

function ProfileSection() {
    // สถานะและข้อมูลที่คอมโพเนนต์ใช้
    const [user, setUser] = useState(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    const getNameParts = (source) => {
        const raw = String(source || "").trim();
        if (!raw) return ["", ""];

        const parts = raw.split(/\s+/).filter(Boolean);
        if (parts.length === 0) return ["", ""];
        if (parts.length === 1) return [parts[0], ""];

        return [parts[0], parts.slice(1).join(" ")];
    };

    // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์

    useEffect(() => {
        const userJson = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (!userJson) return;

        const loadMember = async () => {
            try {
                const u = JSON.parse(userJson);
                const memberId = u.user_id || u.id || u.member_id;
                if (memberId) {
                    const res = await api.get(`/members/${memberId}`);
                    const member = res.data?.data || res.data || u;
                    const merged = { ...u, ...member };
                    const fullName = `${merged.first_name || ""} ${merged.last_name || ""}`.trim() || merged.fullname || "";
                    const [first, last] = getNameParts(fullName || merged.fullname || `${merged.first_name || ""} ${merged.last_name || ""}`);

                    setUser(merged);
                    setFirstName(merged.first_name || first || "");
                    setLastName(merged.last_name || last || "");
                    setPreview(merged.avatar ? `http://localhost:5000${merged.avatar}` : null);
                    return;
                }

                const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.fullname || "";
                const [first, last] = getNameParts(fullName);
                setUser(u);
                setFirstName(u.first_name || first || "");
                setLastName(u.last_name || last || "");
                setPreview(u.avatar ? `http://localhost:5000${u.avatar}` : null);
            } catch (err) {
                const u = JSON.parse(userJson);
                const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.fullname || "";
                const [first, last] = getNameParts(fullName);
                setUser(u);
                setFirstName(u.first_name || first || "");
                setLastName(u.last_name || last || "");
                setPreview(u.avatar ? `http://localhost:5000${u.avatar}` : null);
            }
        };

        loadMember();
    }, []);

    // จัดการเหตุการณ์และการเปลี่ยนแปลงข้อมูล
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImage(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        if (!user) return;

        const safeFirst = firstName.trim();
        const safeLast = lastName.trim();

        if (!safeFirst && !safeLast) {
            Swal.fire({ icon: "warning", title: "กรุณากรอกชื่อก่อนบันทึก" });
            return;
        }

        setLoading(true);

        try {
            const payload = {
                first_name: safeFirst,
                last_name: safeLast,
                email: user.email || "",
                phone: user.phone || null,
                role: user.role || "member",
                status: user.status || "active"
            };

            if (image) {
                const formData = new FormData();
                formData.append("avatar", image);
                const uploadRes = await api.post("/members/avatar", formData);
                if (uploadRes.data.success) {
                    payload.avatar = uploadRes.data.path;
                }
            }

            const memberId = user.user_id || user.id || user.member_id;
            await api.put(`/members/${memberId}`, payload);

            const updatedUser = {
                ...user,
                first_name: safeFirst,
                last_name: safeLast,
                fullname: `${safeFirst} ${safeLast}`.trim(),
                avatar: payload.avatar || user.avatar || null
            };

            localStorage.setItem("user", JSON.stringify(updatedUser));
            sessionStorage.setItem("user", JSON.stringify(updatedUser));

            Swal.fire({
                icon: "success",
                title: "บันทึกข้อมูลส่วนตัวเรียบร้อย",
                timer: 1200,
                showConfirmButton: false
            });

            setUser(updatedUser);
            setImage(null);
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "ผิดพลาด",
                text: err.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้"
            });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    const fullName = `${firstName || user.first_name || ""} ${lastName || user.last_name || ""}`.trim() || user.fullname || "สมาชิก";
    const memberId = user.user_id || user.id || user.member_id || "-";
    const email = user.email || "-";
    const phone = user.phone || "-";
    const normalizeText = (value, fallback) => {
        if (value == null || value === "") return fallback;
        return String(value).trim() || fallback;
    };
    const role = normalizeText(user.role, "member").toUpperCase();
    const status = normalizeText(user.status, "ACTIVE").toUpperCase();

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (
        <div className="card border-0 shadow-sm rounded-4 mb-4" style={{ overflow: "hidden" }}>
            <div className="card-body p-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                    <div>
                        <h5 className="fw-bold mb-1">ข้อมูลโปรไฟล์</h5>
                        <div className="text-muted">ภาพรวมข้อมูลส่วนตัวของคุณ</div>
                    </div>
                    <span className="badge rounded-pill bg-success bg-opacity-10 text-success px-3 py-2" style={{ fontSize: "0.8rem" }}>
                        {status}
                    </span>
                </div>

                <div className="row g-4 align-items-center mb-4">
                    <div className="col-md-4 text-center text-md-start">
                        <img
                            src={
                                preview ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=006664&color=fff&size=256`
                            }
                            alt="avatar"
                            width={110}
                            height={110}
                            style={{ borderRadius: "50%", objectFit: "cover", border: "5px solid #dfeee5" }}
                        />
                    </div>

                    <div className="col-md-8">
                        <div className="fw-bold fs-4 mb-1">{fullName}</div>
                        <div className="text-muted mb-2">{role} • ID #{memberId}</div>

                        <div className="row g-2">
                            <div className="col-sm-6">
                                <div className="text-muted small">อีเมล</div>
                                <div className="fw-semibold">{email}</div>
                            </div>
                            <div className="col-sm-6">
                                <div className="text-muted small">เบอร์โทร</div>
                                <div className="fw-semibold">{phone}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border rounded-4 p-3 bg-light-subtle">
                    <div className="d-flex align-items-center gap-3 mb-3">
                        <div className="flex-grow-1">
                            <label className="form-label mb-1">อัปโหลดรูปโปรไฟล์</label>
                            <input type="file" accept="image/*" className="form-control" onChange={handleImageChange} />
                        </div>
                    </div>

                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">ชื่อ</label>
                            <input
                                className="form-control"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">นามสกุล</label>
                            <input
                                className="form-control"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mt-3 d-flex gap-2">
                        <button className="btn btn-success px-4" onClick={handleSave} disabled={loading}>
                            {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfileSection;
