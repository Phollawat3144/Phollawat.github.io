// จุดประสงค์: แสดงเมนูด้านข้างและข้อมูลบัญชีของผู้ดูแลระบบ
import { NavLink, useNavigate } from "react-router-dom";

import {
    FaHome,
    FaCamera,
    FaUsers,
    FaMapMarkerAlt,
    FaImages,
    FaGlobe,
    FaSignOutAlt
} from "react-icons/fa";

import confirmLogout from "../../services/confirmLogout";

import "../../assets/css/sidebar.css";


function Sidebar() {

    const navigate = useNavigate();


    // =====================================================
    // ดึงข้อมูล Admin ที่ Login อยู่ (storage + จาก API)
    // =====================================================

    // =====================================================
    // Logout
    // =====================================================

    const handleLogout = () => confirmLogout(navigate);


    // =====================================================
    // Admin Menu
    // =====================================================

    const menu = [

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
            icon: <FaUsers />,
            text: "Members"
        },

        {
            to: "/dashboard/locations",
            icon: <FaMapMarkerAlt />,
            text: "Locations"
        },

        {
            to: "/dashboard/profile",
            icon: <FaUsers />,
            text: "Profile"
        }

    ];


    // =====================================================
    // Render
    // =====================================================

    return (

        <aside className="sidebar member-admin-sidebar">

            <div className="sidebar-brand" aria-label="KU CSC Nisit Activities Photo">
                <div className="sidebar-brand-mark" aria-hidden="true">
                    <img src="/logo.png" alt="" />
                </div>
                <div className="sidebar-brand-copy">
                    <strong>KU CSC Nisit</strong>
                    <span>Activities Photo</span>
                </div>
            </div>

            <div className="sidebar-menu">

                {menu.map((item) => (

                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === "/" || item.to === "/dashboard"}
                        className={({ isActive }) =>
                            isActive
                                ? "menu-link active"
                                : "menu-link"
                        }
                    >

                        <span className="icon">{item.icon}</span>

                        <span>{item.text}</span>

                    </NavLink>

                ))}

            </div>


            {/* =================================================
                LOGOUT (kept in footer)
            ================================================= */}

            <div className="sidebar-footer">
                <button
                    type="button"
                    className="logout-btn"
                    onClick={handleLogout}
                    aria-label="Logout"
                    title="Logout"
                >

                    <FaSignOutAlt />
                    <span>Logout</span>

                </button>
            </div>

        </aside>

    );

}


export default Sidebar;
