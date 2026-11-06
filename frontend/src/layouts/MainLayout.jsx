// จุดประสงค์: จัดโครงหน้าเว็บไซต์สาธารณะและส่วนท้าย
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useLocation } from "react-router-dom";

function MainLayout({ children, hideFooter = false }) {

    const location = useLocation();

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (

        <>

            <Navbar />

            <main className={`main-content ${location.pathname === "/" ? "home-main-content" : ""} ${location.pathname === "/login" ? "login-main-content" : ""}`}>

                {children}

            </main>

            {!hideFooter && <Footer />}

        </>

    );

}

export default MainLayout;