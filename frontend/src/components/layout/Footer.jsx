// จุดประสงค์: แสดงส่วนท้ายเว็บไซต์พร้อมลิงก์และข้อมูลโครงการ
import { Link } from "react-router-dom";
import { FaCamera, FaEnvelope, FaGlobe, FaMapPin, FaPhone } from "react-icons/fa";
import "../../assets/css/footer.css";

function Footer() {
  // แสดงผลโครงสร้างหลักของคอมโพเนนต์
  return (
    <footer className="site-footer mt-5 text-white">
      <div className="container footer-container">
        <div className="row g-4">
          <div className="col-lg-4 col-md-6">
            <div className="footer-brand">
              <span className="footer-brand-mark" aria-hidden="true">
                <img src="/logo.png" alt="" />
              </span>
              <span className="footer-brand-copy">
                <strong>KU CSC Nisit</strong>
                <span>Activities Photo</span>
              </span>
            </div>
            <p className="footer-description">
              ชมรมถ่ายภาพและระบบจัดการกิจกรรมสำหรับภาพถ่าย
              และเสนอกิจกรรมรูปแบบที่สะดวกและมีประสิทธิภาพ
            </p>
          </div>

          <div className="col-lg-2 col-md-6">
            <h3 className="footer-heading">Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/gallery">Gallery</Link></li>
              <li><Link to="/login">Login</Link></li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6">
            <h3 className="footer-heading">บริการ</h3>
            <div className="footer-service-list">
              <div className="footer-service-item">
                <span><FaCamera /></span>
                <div>อัปโหลดและจัดการภาพกิจกรรม</div>
              </div>
              <div className="footer-service-item">
                <span><FaGlobe /></span>
                <div>แสดงภาพและรายละเอียดกิจกรรม</div>
              </div>
              <div className="footer-service-item">
                <span><FaMapPin /></span>
                <div>ดูตำแหน่งกิจกรรม</div>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <h3 className="footer-heading">ติดต่อ</h3>
            <ul className="footer-contact-list">
              <li>
                <FaEnvelope />
                <span>อีเมล: Phollawa@ku.ac.th</span>
              </li>
              <li>
                <FaPhone />
                <span>โทรศัพท์: 082-240-1947</span>
              </li>
              <li>
                <FaMapPin />
                <span>ที่อยู่: มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            © {new Date().getFullYear()} KU CSC Nisit Activities Photo. All rights reserved.
            <span className="footer-credit">Designed &amp; Developed by Phollawat Phansaat</span>
          </div>
          <div className="footer-bottom-links">
            <Link to="/gallery">Gallery</Link>
            <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
