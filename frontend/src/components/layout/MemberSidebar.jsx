// จุดประสงค์: แสดงเมนูด้านข้างสมาชิกและข้อมูลบัญชีที่เข้าสู่ระบบ
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
    FaHome,
    FaUser,
    FaCamera,
    FaImages,
    FaGlobe,
    FaSignOutAlt
} from "react-icons/fa";

import api from "../../services/api";
import confirmLogout from "../../services/confirmLogout";
import "../../assets/css/sidebar.css";

function MemberSidebar() {

    const navigate = useNavigate();

    const storedUser = JSON.parse(
        localStorage.getItem("user") ||
        sessionStorage.getItem("user") ||
        "{}"
    );

    // สถานะและข้อมูลที่คอมโพเนนต์ใช้

    const [user, setUser] = useState(storedUser || {});

    // ==============================
    // Load Profile
    // ==============================

    useEffect(() => {

        const syncProfile = (event) => {
            if (event.detail) setUser(event.detail);
        };

        window.addEventListener("profile-updated", syncProfile);

        const id =
            storedUser?.user_id ||
            storedUser?.id ||
            storedUser?.member_id;

        if (!id) {
            return () => window.removeEventListener("profile-updated", syncProfile);
        }

        const loadProfile = async () => {

            try {

                const res = await api.get(`/members/${id}`);

                if (res.data) {

                    const data =
                        res.data.data ||
                        res.data.member ||
                        res.data ||
                        {};

                    const profile =
                        Array.isArray(data)
                            ? data[0]
                            : data;

                    setUser({
                        ...storedUser,
                        ...profile
                    });

                }

            } catch (err) {

                console.log(
                    "Load member profile error:",
                    err
                );

            }

        };

        loadProfile();

        return () => window.removeEventListener("profile-updated", syncProfile);

    }, []);

    // ==============================
    // Logout
    // ==============================

    const handleLogout = () => confirmLogout(navigate);

    // ==============================
    // Menu
    // ==============================

    const memberMenu = [
        {
            to: "/",
            icon: <FaGlobe />,
            text: "Home"
        },
        {
            to: "/member",
            icon: <FaHome />,
            text: "Dashboard"
        },
        {
            to: "/member/upload",
            icon: <FaCamera />,
            text: "Upload Activity"
        },
        {
            to: "/member/gallery",
            icon: <FaImages />,
            text: "My Gallery"
        },
        {
            to: "/member/profile",
            icon: <FaUser />,
            text: "Profile"
        }
    ];

    const adminMenu = [
        {
            to: "/",
            icon: <FaGlobe />,
            text: "Home"
        },
        {
            to: "/dashboard",
            icon: <FaHome />,
            text: "Dashboard"
        },
        {
            to: "/dashboard/activities",
            icon: <FaCamera />,
            text: "Activities"
        },
        {
            to: "/dashboard/gallery",
            icon: <FaImages />,
            text: "Gallery"
        },
        {
            to: "/dashboard/members",
            icon: <FaUser />,
            text: "Members"
        }
    ];

    const contentAdminMenu = [
        {
            to: "/",
            icon: <FaGlobe />,
            text: "Home"
        },
        {
            to: "/member/upload",
            icon: <FaCamera />,
            text: "Upload Activity"
        },
        {
            to: "/member/profile",
            icon: <FaUser />,
            text: "Profile"
        }
    ];

    const isContentAdmin =
        user.role === "admin" &&
        (user.adminLevel === "content_admin" ||
            (!user.adminLevel && user.accountSource === "users"));
    const visibleMenu = isContentAdmin
        ? contentAdminMenu
        : user.role === "admin"
            ? adminMenu
            : memberMenu;

    // ==============================
    // Render
    // ==============================

    return (

        <aside
            className="sidebar member-admin-sidebar"
            style={{
                height: "100vh",
                minHeight: "100vh",
                maxHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxSizing: "border-box"
            }}
        >

            <div className="sidebar-brand" aria-label="KU CSC Nisit Activities Photo">
                <div className="sidebar-brand-mark" aria-hidden="true">
                    <img src="/logo.png" alt="" />
                </div>
                <div className="sidebar-brand-copy">
                    <strong>KU CSC Nisit</strong>
                    <span>Activities Photo</span>
                </div>
            </div>

            {/* ==========================
                Menu
            ========================== */}

            <nav
                className="sidebar-menu"
                style={{
                    flex: "1 1 auto",
                    minHeight: 0,
                    padding: "8px 12px 10px",
                    overflow: "hidden"
                }}
            >

                {visibleMenu.map((item) => (

                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={
                            item.to === "/" ||
                            item.to === "/member" ||
                            item.to === "/dashboard"
                        }
                        className={({ isActive }) =>
                            isActive
                                ? "menu-link active"
                                : "menu-link"
                        }
                        style={{
                            marginBottom: "6px"
                        }}
                    >

                        <span className="icon">
                            {item.icon}
                        </span>

                        <span>
                            {item.text}
                        </span>

                    </NavLink>

                ))}

            </nav>


            {/* ==========================
                Logout
            ========================== */}

            <div
                className="sidebar-footer"
                style={{
                    flexShrink: 0,
                    padding: "12px 18px 18px",
                    marginTop: "auto"
                }}
            >

                <button
                    type="button"
                    className="logout-btn"
                    onClick={handleLogout}
                    aria-label="Logout"
                    title="Logout"
                    style={{
                        width: "100%",
                        minHeight: "48px",
                        borderRadius: "12px"
                    }}
                >

                    <FaSignOutAlt />
                    <span>Logout</span>

                </button>

            </div>

        </aside>

    );

}

export default MemberSidebar;