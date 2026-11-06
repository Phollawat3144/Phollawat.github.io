// จุดประสงค์: แสดงแถบนำทางหลักและสถานะบัญชีผู้ใช้
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import "../../assets/css/navbar.css";
import confirmLogout from "../../services/confirmLogout";

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    // สถานะและข้อมูลที่คอมโพเนนต์ใช้
    const [scrolled, setScrolled] = useState(false);
    const [userName, setUserName] = useState("");
    const [avatar, setAvatar] = useState(null);
    const [userRole, setUserRole] = useState("");

    // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์

    useEffect(() => {

        // จัดการเหตุการณ์และการเปลี่ยนแปลงข้อมูล

        const handleScroll = () => {

            setScrolled(window.scrollY > 20);

        };

        window.addEventListener("scroll", handleScroll);

        return () => window.removeEventListener("scroll", handleScroll);

    }, []);

    useEffect(() => {
        const userJson = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (userJson) {
            const user = JSON.parse(userJson);
            setUserName(user.fullname || user.username || user.email || "สมาชิก");
            setAvatar(user.avatar || user.profile_image || null);
            setUserRole(user.role || "member");
        } else {
            setUserName("");
            setAvatar(null);
            setUserRole("");
        }
        const syncProfile = (event) => {
            const user = event.detail;
            if (!user) return;
            setUserName(user.fullname || user.username || user.email || "สมาชิก");
            setAvatar(user.avatar || user.profile_image || null);
            setUserRole(user.role || "member");
        };

        window.addEventListener("profile-updated", syncProfile);
        return () => window.removeEventListener("profile-updated", syncProfile);
    }, [location]);

    const handleLogout = () => confirmLogout(navigate);

    const profilePath = userRole === "admin" ? "/dashboard/profile" : "/member/profile";
    const userStatusLabel = userRole === "admin" ? "ADMIN" : userRole === "member" ? "Member" : "Active";
    const userStatusClass = userRole === "admin" ? "admin" : userRole === "member" ? "member" : "active";
    const isOverlayPage = location.pathname === "/" || location.pathname === "/login";
    const avatarUrl = avatar
        ? `http://localhost:5000${avatar}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=006664&color=fff`;

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (

        <nav
            className={`navbar navbar-expand-lg custom-navbar fixed-top ${
                scrolled ? "navbar-scrolled" : ""
            } ${isOverlayPage ? "navbar-home-transparent" : ""}`}
            style={{
                zIndex: 1055
            }}
        >

            <div className="container">

                <Link
                    to="/"
                    className="navbar-brand logo d-flex align-items-center logo-wrapper"
                >
                    <img
                        src="/logo.png"
                        alt="KU CSC Nisit Activities Photo"
                        className="navbar-logo"
                        loading="lazy"
                    />
                </Link>

                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                    aria-controls="navbarNav"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div
                    className="collapse navbar-collapse"
                    id="navbarNav"
                >

                    <ul className="navbar-nav mx-auto">

                        <li className="nav-item">
                            <NavLink to="/" end className="nav-link">
                                Home
                            </NavLink>
                        </li>

                        <li className="nav-item">
                            <NavLink to="/gallery" className="nav-link">
                                Gallery
                            </NavLink>
                        </li>

                        <li className="nav-item">
                            <NavLink to="/activity-map" className="nav-link">
                                Activity Map
                            </NavLink>
                        </li>

                        {userName && (
                            <li className="nav-item">
                                <NavLink
                                    to={userRole === "admin" ? "/dashboard" : "/member"}
                                    className="nav-link"
                                >
                                    Dashboard
                                </NavLink>
                            </li>
                        )}

                    </ul>

                    {userName ? (
                        <div className="navbar-account">
                            <Link to={profilePath} className="navbar-profile-link">
                                <img
                                    src={avatarUrl}
                                    alt="รูปโปรไฟล์"
                                    className="navbar-avatar"
                                />
                                <span className="navbar-user-wrap">
                                    <span className="navbar-user">{userName}</span>
                                    <span className={`navbar-user-badge navbar-user-badge-${userStatusClass}`} aria-label="Status">{userStatusLabel}</span>
                                </span>
                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="navbar-logout"
                                aria-label="Logout"
                                title="Logout"
                            >
                                <span className="navbar-logout-inner">
                                    <FaSignOutAlt aria-hidden="true" />
                                    <span>Logout</span>
                                </span>
                            </button>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="btn login-btn"
                        >
                            Login
                        </Link>
                    )}

                </div>

            </div>

        </nav>

    );

}

export default Navbar;
