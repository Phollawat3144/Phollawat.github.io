// จุดประสงค์: แสดงหน้าข่าวหรือเนื้อหาประกาศของเว็บไซต์
import React from "react";
import MainLayout from "../layouts/MainLayout";

export default function News() {
  // แสดงผลโครงสร้างหลักของคอมโพเนนต์
  return (
    <div className="container py-5">
      <div className="card shadow-sm">
        <div className="card-body">
          <h3 className="fw-bold">ข่าวสาร</h3>
          <p className="text-muted">ยังไม่มีข่าวในขณะนี้</p>
        </div>
      </div>
    </div>
  );
}
