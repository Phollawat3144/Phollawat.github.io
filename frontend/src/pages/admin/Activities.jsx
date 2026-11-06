// จุดประสงค์: แสดงและจัดการรายการกิจกรรมในส่วนผู้ดูแลระบบ
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";
import Swal from "sweetalert2";

import AdminLayout from "../../layouts/AdminLayout";
import api from "../../services/api";

export default function Activities() {
  const navigate = useNavigate();
  // สถานะและข้อมูลที่คอมโพเนนต์ใช้
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");

  const fetchActivities = useCallback(async () => {
    const res = await api.get("/activities");
    if (!res.data.success) {
      throw new Error(res.data.message || "โหลดรายการกิจกรรมไม่สำเร็จ");
    }

    return res.data.data || [];
  }, []);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      setActivities(await fetchActivities());
      setLoadError("");
    } catch (err) {
      console.error(err);
      setLoadError(err.response?.data?.message || err.message || "โหลดรายการกิจกรรมไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [fetchActivities]);

  useEffect(() => {
    let active = true;

    fetchActivities()
      .then((data) => {
        if (active) {
          setActivities(data);
          setLoadError("");
        }
      })
      .catch((err) => {
        if (active) {
          console.error(err);
          setLoadError(err.response?.data?.message || err.message || "โหลดรายการกิจกรรมไม่สำเร็จ");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchActivities]);

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      const q = search.toLowerCase();
      return (
        a.activity_name?.toLowerCase().includes(q) ||
        a.location_name?.toLowerCase().includes(q) ||
        (a.activity_date || "").toString().includes(search)
      );
    });
  }, [activities, search]);

  const formatThaiDate = (date) => {
    if (!date) return "-";
    const [y, m, d] = date.split("-");
    return `${Number(d)}/${Number(m)}/${Number(y) + 543}`;
  };

  const formatTime = (time) => (time ? time.substring(0, 5) : "-");

  const deleteActivity = async (id) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ",
      text: "คุณต้องการลบกิจกรรมนี้หรือไม่",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/activities/${id}`);
      Swal.fire({ icon: "success", title: "ลบสำเร็จ", timer: 1500, showConfirmButton: false });
      loadActivities();
    } catch (err) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.response?.data?.message || err.message });
    }
  };

  // แสดงผลโครงสร้างหลักของคอมโพเนนต์
  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="mx-auto mb-5" style={{ maxWidth: 900 }}>
          <div className="input-group shadow-sm">
            <span className="input-group-text bg-white border-end-0">
              <FaSearch />
            </span>
            <input
              className="form-control border-start-0"
              placeholder="ค้นหาชื่อกิจกรรม หรือสถานที่..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ height: 68, fontSize: 18, borderRadius: 15 }}
            />
          </div>
        </div>

        <div className="card border-0 shadow-sm p-4 mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 className="mb-0">จัดการกิจกรรม</h5>
              <small className="text-muted">กิจกรรมทั้งหมด {activities.length}/10 รายการ</small>
            </div>

            <button className="btn btn-success" onClick={() => navigate("/dashboard/activities/new")}> 
              <FaPlus className="me-2" /> เพิ่มกิจกรรม
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle mb-0 w-100">
              <thead className="table-success">
                <tr>
                  <th width="60">ลำดับ</th>
                  <th>ชื่อกิจกรรม</th>
                  <th width="120">วันที่</th>
                  <th width="170">เวลา</th>
                  <th>สถานที่</th>
                  <th width="180" className="text-center">
                    จัดการ
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="spinner-border text-success" />
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={6} className="text-center text-danger py-5" role="alert">
                      {loadError}
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm ms-3"
                        onClick={() => {
                          setLoading(true);
                          loadActivities();
                        }}
                      >
                        ลองอีกครั้ง
                      </button>
                    </td>
                  </tr>
                ) : filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      ไม่มีข้อมูลกิจกรรม
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((item, index) => (
                    <tr key={item.activity_id}>
                      <td>{index + 1}</td>
                      <td>{item.activity_name}</td>
                      <td>{formatThaiDate(item.activity_date)}</td>
                      <td>
                        {formatTime(item.start_time)} - {formatTime(item.end_time)} น.
                      </td>
                      <td>{item.location_name}</td>
                      <td className="text-center">
                        <button
                          className="btn btn-warning btn-sm admin-table-action-edit me-2"
                          aria-label="แก้ไขกิจกรรม"
                          title="แก้ไข"
                          onClick={() => navigate(`/dashboard/activities/edit/${item.activity_id}`)}
                        >
                          <FaEdit className="me-1" />
                          แก้ไข
                        </button>
                        <button
                          className="btn btn-danger btn-sm admin-table-action-delete"
                          aria-label="ลบกิจกรรม"
                          title="ลบ"
                          onClick={() => deleteActivity(item.activity_id)}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
