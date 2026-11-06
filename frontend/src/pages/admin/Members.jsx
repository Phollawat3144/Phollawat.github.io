// จุดประสงค์: ค้นหาและจัดการข้อมูลสมาชิกผ่านตารางและฟอร์มผู้ดูแลระบบ
import { useEffect, useMemo, useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaSearch } from "react-icons/fa";
import Swal from "sweetalert2";
import AdminLayout from "../../layouts/AdminLayout";
import api from "../../services/api";

function Members() {

    // สถานะและข้อมูลที่คอมโพเนนต์ใช้

    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);

    const [editing, setEditing] = useState(null);

    const [form, setForm] = useState({

        first_name: "",

        last_name: "",

        email: "",

        phone: "",

        password: "",

        role: "member",

        status: "1",

        avatar: ""

    });
    const [preview, setPreview] = useState(null);

    const [image, setImage] = useState(null);

    // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์

    useEffect(() => {

        loadMembers();

    }, []);

    const loadMembers = async () => {

        try {

            const res = await api.get("/members");

            if (res.data.success) {

                setMembers(res.data.data);

            }

        } catch (err) {

            console.log(err);

        } finally {

            setLoading(false);

        }

    };

    // จัดการเหตุการณ์และการเปลี่ยนแปลงข้อมูล
    const resetForm = () => {

        setEditing(null);

        setForm({

            first_name: "",

            last_name: "",

            email: "",

            phone: "",

            password: "",

            role: "member",

            status: "1",

            avatar: ""

        });
        setPreview(null);
        setImage(null);

    };

    const openAdd = () => {

        resetForm();

        setShowModal(true);

    };

    const openEdit = (member) => {

        setEditing(member.user_id);

        setForm({

            first_name: member.first_name,

            last_name: member.last_name,

            email: member.email,

            phone: member.phone || "",

            password: "",

            role: member.role,

            status: String(member.status ?? 1),

            avatar: member.avatar || ""

        });

        setPreview(member.avatar ? `http://localhost:5000${member.avatar}` : null);
        setImage(null);
        setShowModal(true);

    };

    const handleChange = (e) => {

        setForm({

            ...form,

            [e.target.name]: e.target.value

        });

    };

    const handleImageChange = (e) => {

        const file = e.target.files[0];

        if (!file) return;

        setImage(file);

        setPreview(URL.createObjectURL(file));

    };

    const saveMember = async () => {

        try {

            const payload = { ...form };

            if (image) {
                const formData = new FormData();
                formData.append("avatar", image);
                const uploadRes = await api.post(
                    "/members/avatar",
                    formData
                );
                if (uploadRes.data.success) {
                    payload.avatar = uploadRes.data.path;
                }
            } else {
                if (!payload.avatar) {
                    delete payload.avatar;
                }
            }

            if (editing) {

                await api.put(

                    `/members/${editing}`,

                    payload

                );

            } else {

                await api.post(

                    "/members",

                    payload

                );

            }

            Swal.fire({

                icon: "success",

                title: "บันทึกสำเร็จ",

                timer: 1200,

                showConfirmButton: false

            });

            setShowModal(false);

            loadMembers();

        } catch (err) {

            Swal.fire({

                icon: "error",

                title: "เกิดข้อผิดพลาด",

                text:

                    err.response?.data?.message ||

                    "ไม่สามารถบันทึกข้อมูลได้"

            });

        }

    };

    const deleteMember = async (id) => {

        const confirm = await Swal.fire({

            title: "ลบสมาชิก ?",

            text: "ไม่สามารถกู้คืนได้",

            icon: "warning",

            showCancelButton: true,

            confirmButtonText: "ลบ",

            cancelButtonText: "ยกเลิก"

        });

        if (!confirm.isConfirmed) return;

        try {

            await api.delete(

                `/members/${id}`

            );

            Swal.fire({

                icon: "success",

                title: "ลบสำเร็จ",

                timer: 1200,

                showConfirmButton: false

            });

            loadMembers();

        } catch {

            Swal.fire(

                "ผิดพลาด",

                "",

                "error"

            );

        }

    };

    const filteredMembers = useMemo(() => {

        return members.filter((m) =>

            m.first_name

                ?.toLowerCase()

                .includes(search.toLowerCase())

            ||

            m.last_name

                ?.toLowerCase()

                .includes(search.toLowerCase())

            ||

            m.email

                ?.toLowerCase()

                .includes(search.toLowerCase())

            ||

            m.phone

                ?.toLowerCase()

                .includes(search.toLowerCase())

        );

    }, [members, search]);

    if (loading) {

        return (

            <AdminLayout>

                <div className="text-center py-5">

                    <div className="spinner-border text-success"></div>

                </div>

            </AdminLayout>

        );

    }
    // แสดงผลโครงสร้างหลักของคอมโพเนนต์
    return (

        <AdminLayout>

            <div className="container-fluid">

                {/* Search */}

                <div className="mx-auto mb-5" style={{ maxWidth: 900 }}>

                    <div className="input-group shadow-sm">

                        <span className="input-group-text bg-white border-end-0">

                            <FaSearch />

                        </span>

                        <input

                            className="form-control border-start-0"

                            placeholder="ค้นหาชื่อ, นามสกุล, อีเมล หรือเบอร์โทร..."

                            value={search}

                            onChange={(e) => setSearch(e.target.value)}

                            style={{

                                height: 68,

                                fontSize: 18,

                                borderRadius: 15

                            }}

                        />

                    </div>

                </div>

                {/* Table */}

                <div className="card border-0 shadow-sm p-4 mb-5">

                    <div className="d-flex justify-content-between align-items-center mb-4">

                        <div>

                            <h5 className="mb-0">จัดการสมาชิก</h5>

                            <small className="text-muted">สมาชิกทั้งหมด {members.length} คน</small>

                        </div>

                        <button className="btn btn-success" onClick={openAdd}>

                            <FaPlus className="me-2" />

                            เพิ่มสมาชิก

                        </button>

                    </div>

                    <div className="table-responsive">

                        <table className="table table-bordered table-hover align-middle mb-0">

                            <thead className="table-success">

                                <tr>

                                    <th width="70">

                                        ลำดับ

                                    </th>

                                    <th width="80">

                                        รูป

                                    </th>

                                    <th>

                                        ชื่อ

                                    </th>

                                    <th>

                                        นามสกุล

                                    </th>

                                    <th>

                                        Email

                                    </th>

                                    <th>

                                        เบอร์โทร

                                    </th>

                                    <th width="120">

                                        สิทธิ์

                                    </th>

                                    <th width="140">

                                        วันที่สมัคร

                                    </th>

                                    <th width="170">

                                        จัดการ

                                    </th>

                                </tr>

                            </thead>

                            <tbody>
                                {filteredMembers.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="9"
                                            className="text-center py-5 text-muted"
                                        >

                                            ไม่พบข้อมูลสมาชิก

                                        </td>

                                    </tr>

                                ) : (

                                    filteredMembers.map((member, index) => (

                                        <tr key={member.user_id}>

                                            <td>

                                                {index + 1}

                                            </td>

                                            <td>

                                                <img

                                                    src={
                                                        member.avatar
                                                            ? `http://localhost:5000${member.avatar}`

                                                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(member.first_name + ' ' + member.last_name)}&background=006664&color=fff`
                                                    }

                                                    alt="avatar"

                                                    width="45"

                                                    height="45"

                                                    style={{

                                                        borderRadius: "50%",

                                                        objectFit: "cover"

                                                    }}

                                                />

                                            </td>

                                            <td>

                                                <strong>

                                                    {member.first_name}

                                                </strong>

                                            </td>

                                            <td>

                                                {member.last_name}

                                            </td>

                                            <td>

                                                {member.email}

                                            </td>

                                            <td>

                                                {member.phone || "-"}

                                            </td>

                                            <td>

                                                {member.role === "admin" ? (

                                                    <span className="badge bg-danger">

                                                        ADMIN

                                                    </span>

                                                ) : (

                                                    <span className="badge bg-primary">

                                                        MEMBER

                                                    </span>

                                                )}

                                            </td>

                                            <td>

                                                {new Date(

                                                    member.created_at

                                                ).toLocaleDateString("th-TH")}

                                            </td>

                                            <td className="text-center">

                                                <div className="d-flex justify-content-center gap-2">

                                                    <button

                                                        className="btn btn-warning btn-sm admin-table-action-edit"
                                                        aria-label="แก้ไขสมาชิก"
                                                        title="แก้ไข"

                                                        onClick={() => openEdit(member)}

                                                    >

                                                        <FaEdit />

                                                    </button>

                                                    <button

                                                        className="btn btn-danger btn-sm admin-table-action-delete"
                                                        aria-label="ลบสมาชิก"
                                                        title="ลบ"

                                                        onClick={() => deleteMember(member.user_id)}

                                                    >

                                                        <FaTrash />

                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    ))

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>
                {/* Modal */}

                {showModal && (

                    <div
                        className="modal d-block"
                        style={{

                            background: "rgba(0,0,0,.45)"

                        }}
                    >

                        <div className="modal-dialog modal-xl modal-dialog-centered">

                            <div className="modal-content border-0 shadow rounded-4 overflow-hidden bg-white">

                                <div className="modal-header bg-success text-white rounded-0 px-4 py-3">

                                    <h5 className="modal-title mb-0">

                                        {editing

                                            ? "แก้ไขสมาชิก"

                                            : "เพิ่มสมาชิก"}

                                    </h5>

                                    <button

                                        className="btn-close btn-close-white"

                                        onClick={() =>

                                            setShowModal(false)

                                        }

                                    />

                                </div>
                                <div className="modal-body p-4">

                                    <div className="row g-4">

                                        <div className="col-md-6">

                                            <div className="mb-3">
                                                <label className="form-label fw-semibold mb-2">
                                                    ชื่อ
                                                </label>
                                                <input
                                                    type="text"
                                                    name="first_name"
                                                    className="form-control"
                                                    placeholder="กรอกชื่อ"
                                                    value={form.first_name}
                                                    onChange={handleChange}
                                                    style={{
                                                        borderRadius: 12,
                                                        height: 48,
                                                        border: "1px solid #ddd"
                                                    }}
                                                />
                                            </div>

                                        </div>

                                        <div className="col-md-6">

                                            <div className="mb-3">
                                                <label className="form-label fw-semibold mb-2">
                                                    นามสกุล
                                                </label>
                                                <input
                                                    type="text"
                                                    name="last_name"
                                                    className="form-control"
                                                    placeholder="กรอกนามสกุล"
                                                    value={form.last_name}
                                                    onChange={handleChange}
                                                    style={{
                                                        borderRadius: 12,
                                                        height: 48,
                                                        border: "1px solid #ddd"
                                                    }}
                                                />
                                            </div>

                                        </div>

                                        <div className="col-md-6">

                                            <div className="mb-3">
                                                <label className="form-label fw-semibold mb-2">
                                                    อีเมล
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    className="form-control"
                                                    placeholder="กรอกอีเมล"
                                                    value={form.email}
                                                    onChange={handleChange}
                                                    style={{
                                                        borderRadius: 12,
                                                        height: 48,
                                                        border: "1px solid #ddd"
                                                    }}
                                                />
                                            </div>

                                        </div>

                                        <div className="col-md-6">

                                            <div className="mb-3">
                                                <label className="form-label fw-semibold mb-2">
                                                    รหัสผ่าน
                                                </label>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    className="form-control"
                                                    placeholder="กรอกรหัสผ่าน"
                                                    value={form.password}
                                                    onChange={handleChange}
                                                    style={{
                                                        borderRadius: 12,
                                                        height: 48,
                                                        border: "1px solid #ddd"
                                                    }}
                                                />
                                            </div>

                                        </div>

                                        <div className="col-md-6">

                                            <div className="mb-3">
                                                <label className="form-label fw-semibold mb-2">
                                                    เบอร์โทร
                                                </label>
                                                <input
                                                    type="text"
                                                    name="phone"
                                                    className="form-control"
                                                    placeholder="กรอกเบอร์โทร"
                                                    value={form.phone}
                                                    onChange={handleChange}
                                                    style={{
                                                        borderRadius: 12,
                                                        height: 48,
                                                        border: "1px solid #ddd"
                                                    }}
                                                />
                                            </div>

                                        </div>

                                        <div className="col-md-6">

                                            <div className="mb-3">
                                                <label className="form-label fw-semibold mb-2">
                                                    สิทธิ์ผู้ใช้งาน
                                                </label>
                                                <select
                                                    name="role"
                                                    className="form-select"
                                                    value={form.role}
                                                    onChange={handleChange}
                                                    style={{
                                                        borderRadius: 12,
                                                        height: 48,
                                                        border: "1px solid #ddd"
                                                    }}
                                                >
                                                    <option value="member">Member</option>
                                                    <option value="admin">Admin (แดชบอร์ดผู้ดูแลระบบ)</option>
                                                </select>
                                            </div>

                                        </div>

                                        <div className="col-md-6">

                                            <div className="mb-3">
                                                <label className="form-label fw-semibold mb-2">
                                                    รูปโปรไฟล์
                                                </label>
                                                <input
                                                    type="file"
                                                    name="avatar"
                                                    className="form-control"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    style={{
                                                        borderRadius: 12,
                                                        height: 48,
                                                        border: "1px solid #ddd"
                                                    }}
                                                />
                                                {preview && (
                                                    <div className="mt-3">
                                                        <img
                                                            src={preview}
                                                            alt="Preview"
                                                            style={{
                                                                width: 120,
                                                                height: 120,
                                                                borderRadius: 16,
                                                                objectFit: "cover",
                                                                border: "1px solid #dee2e6"
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                        </div>

                                    </div>

                                </div>

                                <div className="modal-footer">

                                    <button

                                        className="btn btn-secondary"

                                        onClick={() =>

                                            setShowModal(false)

                                        }

                                    >

                                        ยกเลิก

                                    </button>

                                    <button

                                        className="btn btn-success"

                                        onClick={saveMember}

                                    >

                                        บันทึกข้อมูล

                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                )}
            </div>

        </AdminLayout>

    );

}

export default Members;
