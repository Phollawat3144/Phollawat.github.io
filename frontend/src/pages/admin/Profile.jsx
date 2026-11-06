// จุดประสงค์: โหลดและแก้ไขข้อมูลโปรไฟล์ผู้ดูแลระบบ
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FaCamera, FaCheckCircle, FaEnvelope, FaIdCard, FaPhone, FaShieldAlt, FaUser } from "react-icons/fa";
import api from "../../services/api";

function AdminProfile() {
  const navigate = useNavigate();
  // สถานะและข้อมูลที่คอมโพเนนต์ใช้
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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

  const getImageUrl = (source, version = "") => {
    if (!source) return null;
    if (/^(https?:|data:|blob:)/i.test(source)) return source;

    const path = source.startsWith("/") ? source : `/${source}`;
    return `http://localhost:5000${path}${version ? `?v=${version}` : ""}`;
  };

  // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์

  useEffect(() => {
    const userJson = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userJson) return navigate("/login", { replace: true });

    const setProfile = (profile) => {
      const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.fullname || "";
      const [first, last] = getNameParts(fullName);
      const avatar = profile.avatar || profile.profile_image || profile.profileImage ||
        profile.photo || profile.picture || profile.image || profile.photo_url ||
        profile.image_url || profile.avatar_url || null;
      const normalized = { ...profile, avatar };

      setUser(normalized);
      setFirstName(profile.first_name || first || "");
      setLastName(profile.last_name || last || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
      setPreview(getImageUrl(avatar));
    };

    const loadProfile = async () => {
      const storedUser = JSON.parse(userJson);
      try {
        const response = await api.get("/auth/profile");
        setProfile({ ...storedUser, ...(response.data?.data || {}) });
      } catch (err) {
        setProfile(storedUser);
        Swal.fire({
          icon: "error",
          title: "โหลดข้อมูลไม่สำเร็จ",
          text: err.response?.data?.message || "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้"
        });
      }
    };

    loadProfile();
  }, [navigate]);

  // จัดการเหตุการณ์และการเปลี่ยนแปลงข้อมูล
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email: email.trim(),
        phone,
      };

      if (image) {
        const formData = new FormData();
        formData.append("avatar", image);
        const uploadRes = await api.post("/members/avatar", formData);
        if (!uploadRes.data?.success || !uploadRes.data?.path) {
          throw new Error(uploadRes.data?.message || "ไม่สามารถอัปโหลดรูปโปรไฟล์ได้");
        }
        payload.avatar = uploadRes.data.path;
      }

      const response = await api.put("/auth/profile", payload);
      const updatedUser = { ...user, ...(response.data?.data || {}) };
      updatedUser.fullname = `${firstName} ${lastName}`.trim();
      updatedUser.first_name = firstName;
      updatedUser.last_name = lastName;
      updatedUser.email = email.trim();
      updatedUser.phone = phone;
      if (payload.avatar) updatedUser.avatar = payload.avatar;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new CustomEvent("profile-updated", { detail: updatedUser }));

      Swal.fire({ icon: "success", title: "บันทึกเรียบร้อย", timer: 1200, showConfirmButton: false });
      setUser(updatedUser);
      setImage(null);
      setPreview(getImageUrl(updatedUser.avatar || updatedUser.profile_image, Date.now()));
    } catch (err) {
      Swal.fire({ icon: "error", title: "ผิดพลาด", text: err.response?.data?.message || err.message || "ไม่สามารถบันทึกข้อมูลได้" });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const displayName = `${firstName} ${lastName}`.trim() || user.fullname || user.username || "Administrator";
  const roleLabel = user.role ? String(user.role).toUpperCase() : "ADMIN";
  const createdDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })
    : "-";
  const infoItems = [
    { icon: <FaEnvelope />, label: "อีเมล", value: email || "-" },
    { icon: <FaPhone />, label: "เบอร์โทรศัพท์", value: phone || "ยังไม่ได้ระบุ" },
    { icon: <FaShieldAlt />, label: "บทบาท", value: roleLabel },
    { icon: <FaUser />, label: "วันที่สมัครสมาชิก", value: createdDate },
  ];

  // แสดงผลโครงสร้างหลักของคอมโพเนนต์
  return (
    <div className="admin-profile-page">
      <div className="row g-4 align-items-stretch">
        <div className="col-xl-4">
          <div className="admin-profile-card admin-profile-identity h-100">
            <div className="admin-profile-avatar-wrap">
              <img
                src={preview || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=006664&color=fff&size=256`}
                alt={displayName}
                className="admin-profile-avatar"
              />
              <span className="admin-profile-online"><FaCheckCircle /></span>
            </div>
            <h3>{displayName}</h3>
            <p>{email || "ไม่มีอีเมล"}</p>
            <div className="admin-profile-status"><FaCheckCircle /> บัญชีพร้อมใช้งาน</div>

            <label className="admin-profile-upload">
              <FaCamera /> เปลี่ยนรูปโปรไฟล์
              <input type="file" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>
        </div>

        <div className="col-xl-8">
          <div className="admin-profile-card h-100">
            <div className="admin-profile-section-heading">
              <div>
                <span className="admin-profile-eyebrow">Personal Details</span>
                <h3>ข้อมูลส่วนตัว</h3>
              </div>
              <FaUser />
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="admin-profile-label">ชื่อ</label>
                <input className="form-control member-admin-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="admin-profile-label">นามสกุล</label>
                <input className="form-control member-admin-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="admin-profile-label">เบอร์โทรศัพท์</label>
                <input type="tel" className="form-control member-admin-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="ยังไม่ได้ระบุ" />
              </div>
              <div className="col-md-6">
                <label className="admin-profile-label">อีเมล</label>
                <input type="email" className="form-control member-admin-input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
              </div>
            </div>

            <div className="admin-profile-section-heading admin-profile-account-heading">
              <div>
                <span className="admin-profile-eyebrow">Account Information</span>
                <h3>ข้อมูลบัญชี</h3>
              </div>
              <FaIdCard />
            </div>
            <div className="admin-profile-info-grid">
              {infoItems.map((item) => (
                <div className="admin-profile-info-item" key={item.label}>
                  <span className="admin-profile-info-icon">{item.icon}</span>
                  <div>
                    <small>{item.label}</small>
                    <strong>{item.value}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-profile-actions">
              <button className="btn btn-outline-success rounded-3 px-4" onClick={() => navigate(-1)}>ยกเลิก</button>
              <button className="btn btn-success rounded-3 px-4 fw-bold" onClick={handleSave} disabled={loading}>
                {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProfile;
