// จุดประสงค์: โหลด ค้นหา และจัดการรายการสถานที่ในส่วนผู้ดูแลระบบ
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import Swal from "sweetalert2";

import AdminLayout from "../../layouts/AdminLayout";
import api from "../../services/api";

function Locations() {

    const navigate = useNavigate();

    // สถานะและข้อมูลที่คอมโพเนนต์ใช้

    const [locations, setLocations] = useState([]);

    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์

    useEffect(() => {

        loadLocations();

    }, []);

    // ==========================
    // โหลดข้อมูลสถานที่
    // ==========================

    const loadLocations = async () => {

        try {

            setLoading(true);

            const res = await api.get("/locations");

            setLocations(res.data.data || []);

        }

        catch (err) {

            console.log(err);

            Swal.fire({

                icon: "error",

                title: "เกิดข้อผิดพลาด",

                text:

                    err.response?.data?.error ||

                    err.message

            });

        }

        finally {

            setLoading(false);

        }

    };

    // ==========================
    // ลบสถานที่
    // ==========================

    const deleteLocation = async (id) => {

        const result = await Swal.fire({

            title: "ยืนยันการลบ",

            text: "ต้องการลบสถานที่นี้หรือไม่",

            icon: "warning",

            showCancelButton: true,

            confirmButtonText: "ลบ",

            cancelButtonText: "ยกเลิก"

        });

        if (!result.isConfirmed) return;

        try {

            await api.delete(`/locations/${id}`);

            Swal.fire({

                icon: "success",

                title: "ลบสำเร็จ",

                timer: 1500,

                showConfirmButton: false

            });

            loadLocations();

        }

        catch (err) {

            Swal.fire({

                icon: "error",

                title: "เกิดข้อผิดพลาด",

                text:

                    err.response?.data?.error ||

                    err.message

            });

        }

    };


    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return locations.filter((l) =>
            l.location_name?.toLowerCase().includes(q) ||
            (l.latitude || "").toString().includes(search) ||
            (l.longitude || "").toString().includes(search)
        );
    }, [locations, search]);

    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (
        <AdminLayout>
            <div className="container-fluid">
                <div className="mx-auto mb-5" style={{ maxWidth: 900 }}>
                    <div className="input-group shadow-sm">
                        <span className="input-group-text bg-white border-end-0"><FaSearch /></span>
                        <input
                            className="form-control border-start-0"
                            placeholder="ค้นหาชื่อสถานที่, latitude, longitude..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ height: 68, fontSize: 18, borderRadius: 15 }}
                        />
                    </div>
                </div>

                <div className="card border-0 shadow-sm p-4 mb-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h5 className="mb-0">จัดการสถานที่</h5>
                            <small className="text-muted">สถานที่ทั้งหมด {locations.length} รายการ</small>
                        </div>
                        <button className="btn btn-success" onClick={() => navigate("/dashboard/locations/new")}>
                            <FaPlus className="me-2" /> เพิ่มสถานที่
                        </button>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-bordered table-hover align-middle mb-0 w-100">
                            <thead className="table-success">
                                <tr>
                                    <th width="70">#</th>
                                    <th>ชื่อสถานที่</th>
                                    <th width="180">Latitude</th>
                                    <th width="180">Longitude</th>
                                    <th width="150" className="text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-5">
                                            <div className="spinner-border text-success"></div>
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-5">ไม่มีข้อมูลสถานที่</td>
                                    </tr>
                                ) : (
                                    filtered.map((item, index) => (
                                        <tr key={item.location_id}>
                                            <td>{index + 1}</td>
                                            <td>{item.location_name}</td>
                                            <td>{item.latitude}</td>
                                            <td>{item.longitude}</td>
                                            <td className="text-center">
                                                <button
                                                    className="btn btn-warning btn-sm admin-table-action-edit me-2"
                                                    aria-label="แก้ไขสถานที่"
                                                    title="แก้ไข"
                                                    onClick={() => navigate(`/dashboard/locations/edit/${item.location_id}`)}
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm admin-table-action-delete"
                                                    aria-label="ลบสถานที่"
                                                    title="ลบ"
                                                    onClick={() => deleteLocation(item.location_id)}
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

export default Locations;
