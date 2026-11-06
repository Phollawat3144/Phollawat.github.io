// จุดประสงค์: โหลดและปรับปรุงข้อมูลบัญชีและโปรไฟล์สมาชิก
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FaCamera, FaCheckCircle, FaEnvelope, FaIdCard, FaPhone, FaShieldAlt, FaUser } from "react-icons/fa";
import api from "../../services/api";

function Profile() {
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

  // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์

  useEffect(() => {
    const userJson = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userJson) return navigate("/login", { replace: true });

    const loadMemberProfile = async () => {
      try {
        const u = JSON.parse(userJson);
        const memberId = u.user_id || u.id || u.member_id;

        if (memberId) {
          const res = await api.get(`/members/${memberId}`);
          const member = res.data?.data || res.data || u;
          const merged = { ...u, ...member };
          setUser(merged);

          const fullName = `${merged.first_name || ""} ${merged.last_name || ""}`.trim() || merged.fullname || "";
          const [first, last] = getNameParts(fullName);
          setFirstName(first || merged.first_name || "");
          setLastName(last || merged.last_name || "");
          setEmail(merged.email || "");
          setPhone(merged.phone || "");
          setPreview(merged.avatar ? `http://localhost:5000${merged.avatar}` : null);
          return;
        }

        setUser(u);
        const [first, last] = getNameParts(u.fullname || `${u.first_name || ""} ${u.last_name || ""}`);
        setFirstName(first || u.first_name || "");
        setLastName(last || u.last_name || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setPreview(u.avatar ? `http://localhost:5000${u.avatar}` : null);
      } catch {
        const u = JSON.parse(userJson);
        setUser(u);
        const [first, last] = getNameParts(u.fullname || `${u.first_name || ""} ${u.last_name || ""}`);
        setFirstName(first || u.first_name || "");
        setLastName(last || u.last_name || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setPreview(u.avatar ? `http://localhost:5000${u.avatar}` : null);
      }
    };

    loadMemberProfile();
  }, [navigate]);

  // จัดการเหตุการณ์และการเปลี่ยนแปลงข้อมูล
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));

    if (!user) return;

    setLoading(true);
    try {
      const memberId = user.user_id || user.id || user.member_id;
      const formData = new FormData();
      formData.append("avatar", file);

      const uploadRes = await api.post("/members/avatar", formData);
      const avatarPath = uploadRes.data?.path;

      if (!uploadRes.data?.success || !avatarPath) {
        throw new Error("ไม่สามารถอัปโหลดรูปโปรไฟล์ได้");
      }

      await api.put(`/members/${memberId}`, {
        first_name: firstName,
        last_name: lastName,
        email: email.trim(),
        phone,
        role: user.role || "member",
        status: user.status || "active",
        avatar: avatarPath,
      });

      const refreshedResponse = await api.get(`/members/${memberId}`);
      const updatedUser = { ...user, ...(refreshedResponse.data?.data || {}), avatar: avatarPath };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new CustomEvent("profile-updated", { detail: updatedUser }));
      setUser(updatedUser);
      setImage(null);
      setPreview(`http://localhost:5000${avatarPath}?v=${Date.now()}`);
    } catch (err) {
      Swal.fire({ icon: "error", title: "อัปโหลดไม่สำเร็จ", text: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
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
        role: user.role || "member",
        status: user.status || "active",
      };

      if (image) {
        const formData = new FormData();
        formData.append("avatar", image);
        const uploadRes = await api.post("/members/avatar", formData);
        if (uploadRes.data.success) {
          payload.avatar = uploadRes.data.path;
        }
      }

      await api.put(`/members/${user.user_id || user.id || user.member_id}`, payload);

      // update localStorage user
      const updatedUser = { ...user };
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
    } catch (err) {
      Swal.fire({ icon: "error", title: "ผิดพลาด", text: err.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้" });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const displayName = `${firstName} ${lastName}`.trim() || user.fullname || user.username || "Member";
  const roleLabel = user.role ? String(user.role).toUpperCase() : "MEMBER";
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
              <img src={preview || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=006664&color=fff&size=256`} alt={displayName} className="admin-profile-avatar" />
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
                  <div><small>{item.label}</small><strong>{item.value}</strong></div>
                </div>
              ))}
            </div>

            <div className="admin-profile-actions">
              <button className="btn btn-outline-success rounded-3 px-4" onClick={() => navigate(-1)}>ยกเลิก</button>
              <button className="btn btn-success rounded-3 px-4 fw-bold" onClick={handleSave} disabled={loading}>{loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
