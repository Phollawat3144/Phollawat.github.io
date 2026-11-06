// จุดประสงค์: จัดการการลงชื่อเข้าใช้และการส่งข้อมูลบัญชี
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FaEye, FaEyeSlash, FaUser, FaUserShield } from "react-icons/fa";
import api from "../services/api";
import "../assets/css/login.css";

const styleForgotPasswordButtons = () => {
  const confirmButton = Swal.getConfirmButton();
  const cancelButton = Swal.getCancelButton();

  if (confirmButton) {
    confirmButton.style.backgroundColor = "#006664";
    confirmButton.style.border = "2px solid #006664";
    confirmButton.style.color = "#fff";
  }

  if (cancelButton) {
    cancelButton.style.backgroundColor = "#fff";
    cancelButton.style.border = "2px solid #006664";
    cancelButton.style.color = "#006664";
  }
};

function Login() {
  const navigate = useNavigate();
  // สถานะและข้อมูลที่คอมโพเนนต์ใช้
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "member",
    remember: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์

  useEffect(() => {
    const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    const userJson = localStorage.getItem("user") || sessionStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;

    if (storedToken && user) {
      const isContentAdmin =
        user.role === "admin" &&
        (user.adminLevel === "content_admin" ||
          (!user.adminLevel && user.accountSource === "users"));
      navigate(
        user.role === "admin" && !isContentAdmin
          ? "/dashboard"
          : isContentAdmin
            ? "/member/upload"
            : "/member",
        { replace: true }
      );
    }
  }, [navigate]);

  // จัดการเหตุการณ์และการเปลี่ยนแปลงข้อมูล

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
  };

  const togglePasswordVisibility = () => {
    setShowPassword((visible) => !visible);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", {
        identity: formData.email,
        password: formData.password,
        role: formData.role,
      });

      if (response.data.success) {
        const storage = formData.remember ? localStorage : sessionStorage;
        storage.setItem("token", response.data.token);
        storage.setItem("user", JSON.stringify(response.data.user));

        const isContentAdmin = response.data.user?.adminLevel === "content_admin";
        const redirectPath = response.data.user?.role === "admin"
          ? isContentAdmin ? "/member/upload" : "/dashboard"
          : "/member";
        const message = isContentAdmin
          ? "กำลังเปลี่ยนหน้าไปหน้าอัปโหลดภาพกิจกรรม"
          : response.data.user?.role === "admin"
            ? "กำลังเปลี่ยนหน้าไปแดชบอร์ดผู้ดูแล"
            : "กำลังเปลี่ยนหน้าไปหน้าสมาชิก";

        await Swal.fire({
          icon: "success",
          title: "เข้าสู่ระบบสำเร็จ",
          text: message,
          timer: 1200,
          showConfirmButton: false,
        });

        navigate(redirectPath, { replace: true });
      } else {
        setError(response.data.message || "เข้าสู่ระบบไม่สำเร็จ");
      }
    } catch (err) {
      setError(err.response?.data?.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    let step = "email";
    let resetId = null;
    let email = "";
    let otp = "";

    const result = await Swal.fire({
      title: "ลืมรหัสผ่าน",
      html: `
        <input id="forgot-email" type="email" class="swal2-input" autocomplete="email" placeholder="อีเมลที่ลงทะเบียน">
      `,
      confirmButtonText: "ขอ OTP",
      cancelButtonText: "ยกเลิก",
      showCancelButton: true,
      reverseButtons: true,
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        if (step === "email") {
          email = document.getElementById("forgot-email").value.trim();
          if (!email) {
            Swal.showValidationMessage("กรุณากรอกอีเมลที่ลงทะเบียน");
            return false;
          }

          try {
            const response = await api.post("/auth/forgot-password", {
              email,
              role: formData.role,
            });
            resetId = response.data.resetId;
            step = "otp";
            Swal.hideLoading();
            Swal.update({
              title: "กรอกรหัส OTP",
              html: `
                <input id="forgot-otp" class="swal2-input" inputmode="numeric" autocomplete="one-time-code" placeholder="รหัส OTP">
              `,
              confirmButtonText: "ยืนยัน OTP",
            });
            styleForgotPasswordButtons();
            return false;
          } catch (error) {
            Swal.showValidationMessage(
              error.response?.data?.message || "ขอ OTP ไม่สำเร็จ กรุณาลองใหม่"
            );
            return false;
          }
        }

        if (step === "otp") {
          otp = document.getElementById("forgot-otp").value.trim();
          if (!otp) {
            Swal.showValidationMessage("กรุณากรอกรหัส OTP");
            return false;
          }

          try {
            await api.post("/auth/verify-reset-otp", { email, resetId, otp });
            step = "password";
            Swal.hideLoading();
            Swal.update({
              title: "ตั้งรหัสผ่านใหม่",
              html: `
                <input id="forgot-password" type="password" class="swal2-input" autocomplete="new-password" placeholder="รหัสผ่านใหม่">
                <input id="forgot-confirm-password" type="password" class="swal2-input" autocomplete="new-password" placeholder="ยืนยันรหัสผ่านใหม่">
              `,
              confirmButtonText: "เปลี่ยนรหัสผ่าน",
            });
            styleForgotPasswordButtons();
            return false;
          } catch (error) {
            Swal.showValidationMessage(
              error.response?.data?.message || "ยืนยัน OTP ไม่สำเร็จ กรุณาลองใหม่"
            );
            return false;
          }
        }

        const newPassword = document.getElementById("forgot-password").value;
        const confirmPassword = document.getElementById("forgot-confirm-password").value;

        if (!newPassword || !confirmPassword) {
          Swal.showValidationMessage("กรุณากรอกรหัสผ่านใหม่ให้ครบ");
          return false;
        }
        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage("รหัสผ่านใหม่และการยืนยันไม่ตรงกัน");
          return false;
        }

        try {
          await api.post("/auth/reset-password", {
            email,
            resetId,
            otp,
            newPassword,
          });
          return true;
        } catch (error) {
          Swal.showValidationMessage(
            error.response?.data?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่"
          );
          return false;
        }
      },
      didOpen: (popup) => {
        styleForgotPasswordButtons();
        popup.querySelector("#forgot-email").value = formData.email;
      },
    });

    if (result.isConfirmed) {
      await Swal.fire({
        icon: "success",
        title: "เปลี่ยนรหัสผ่านเรียบร้อย",
        text: "เข้าสู่ระบบด้วยรหัสผ่านใหม่ได้เลย",
        confirmButtonColor: "#006664",
      });
    }
  };

  // แสดงผลโครงสร้างหลักของคอมโพเนนต์
  return (
    <div className="login-page">
      <div className="container">
        <div className="row justify-content-center align-items-center login-row">
          <div className="col-xl-10 col-lg-11">
            <div className="login-card login-card-split">
              <div className="login-left-panel">
              <div className="p-5 login-form-panel">
                <div className="mb-4 login-heading">
                  <h2 className="fw-bold">Sign in</h2>
                </div>

                {error && (
                  <div className="alert alert-danger py-2" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <label className="form-label fw-semibold text-uppercase mb-0 login-label">
                        Role
                      </label>
                    </div>
                    <div className="d-flex gap-2 role-selector">
                      <button
                        type="button"
                        className={`btn flex-fill rounded-pill py-2 role-button role-button-member ${formData.role === "member" ? "role-button-selected" : ""}`}
                        onClick={() => setFormData((prev) => ({ ...prev, role: "member" }))}
                        aria-pressed={formData.role === "member"}
                      >
                        <FaUser className="me-2" aria-hidden="true" />
                        Member
                      </button>

                      <button
                        type="button"
                        className={`btn flex-fill rounded-pill py-2 role-button role-button-admin ${formData.role === "admin" ? "role-button-selected" : ""}`}
                        onClick={() => setFormData((prev) => ({ ...prev, role: "admin" }))}
                        aria-pressed={formData.role === "admin"}
                      >
                        <FaUserShield className="me-2" aria-hidden="true" />
                        Admin
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label mb-1 white-label" style={{ fontSize: "0.85rem" }}>
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="text"
                      className="form-control form-control-sm rounded-3 login-input shadow-sm"
                      style={{ fontSize: "0.95rem", padding: "0.9rem 1rem" }}
                      placeholder="Enter email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label mb-1 white-label" style={{ fontSize: "0.85rem" }}>
                      Password
                    </label>
                    <div className="input-group">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        className="form-control form-control-sm rounded-start-3 login-input login-password-input shadow-sm"
                        style={{ fontSize: "0.95rem", padding: "0.9rem 1rem" }}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        aria-label="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <button
                        type="button"
                        className="btn rounded-end-3 password-toggle"
                        onClick={togglePasswordVisibility}
                        aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                        aria-controls="password"
                        aria-pressed={showPassword}
                        data-password-visible={showPassword ? "true" : "false"}
                        title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                      >
                        {showPassword ? <FaEye aria-hidden="true" /> : <FaEyeSlash aria-hidden="true" />}
                      </button>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input
                        id="remember"
                        name="remember"
                        type="checkbox"
                        className="form-check-input"
                        checked={formData.remember}
                        onChange={handleChange}
                      />
                      <label htmlFor="remember" className="form-check-label">
                        Remember Me
                      </label>
                    </div>
                    <button
                      type="button"
                      className="btn forgot-password-btn"
                      onClick={handleForgot}
                                        >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-lg w-100 login-submit shadow-sm"
                    style={{
                      background: "#006664",
                      border: "2px solid #006664",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "1.05rem",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#006664";
                      e.currentTarget.style.color = "#fff";
                      e.currentTarget.style.borderColor = "#006664";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#006664";
                      e.currentTarget.style.color = "#ffffff";
                      e.currentTarget.style.borderColor = "#006664";
                    }}
                    disabled={loading}
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </button>
                </form>
              </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
