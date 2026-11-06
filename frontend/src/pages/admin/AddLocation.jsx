// จุดประสงค์: เพิ่มหรือแก้ไขสถานที่และตำแหน่งบนแผนที่
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import AdminLayout from "../../layouts/AdminLayout";
import LocationPicker from "../../components/map/LocationPicker";
import api from "../../services/api";

function AddLocation() {

    const navigate = useNavigate();

    const { id } = useParams();

    const isEdit = !!id;

    // สถานะและข้อมูลที่คอมโพเนนต์ใช้

    const [loading, setLoading] = useState(false);

    const [resolvingLocationName, setResolvingLocationName] = useState(false);

    const geocodingRequestRef = useRef(null);

    const [form, setForm] = useState({

        location_name: "",

        latitude: "",

        longitude: ""

    });

    // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์

    useEffect(() => {

        if (isEdit) {

            loadLocation();

        }

    }, []);

    // ==========================
    // โหลดข้อมูล
    // ==========================

    const loadLocation = async () => {

        try {

            const res = await api.get(

                `/locations/${id}`

            );

            const data = res.data.data;

            setForm({

                location_name:

                    data.location_name,

                latitude:

                    data.latitude,

                longitude:

                    data.longitude

            });

        }

        catch (err) {

            console.log(err);

        }

    };

    // ==========================
    // เปลี่ยนค่า Input
    // ==========================

    const handleChange = (e) => {

        setForm({

            ...form,

            [e.target.name]: e.target.value

        });

    };

    const handleMapPositionChange = (position) => {

        geocodingRequestRef.current?.abort();

        const controller = new AbortController();

        geocodingRequestRef.current = controller;

        setForm((currentForm) => ({

            ...currentForm,

            latitude: String(position.lat),

            longitude: String(position.lng)

        }));

        setResolvingLocationName(true);

        const coordinates = new URLSearchParams({
            format: "jsonv2",
            lat: String(position.lat),
            lon: String(position.lng),
            "accept-language": "th"
        });

        fetch(
            `https://nominatim.openstreetmap.org/reverse?${coordinates}`,
            {
                headers: {
                    "Accept-Language": "th"
                },
                signal: controller.signal
            }
        )
            .then((response) => {
                if (!response.ok) {
                    throw new Error("ไม่สามารถค้นหาชื่อสถานที่จากแผนที่ได้");
                }

                return response.json();
            })
            .then((result) => {
                if (geocodingRequestRef.current !== controller) return;

                const address = result.address || {};
                const addressName = [
                    address.amenity,
                    address.tourism,
                    address.leisure,
                    address.shop,
                    address.building,
                    address.road,
                    address.neighbourhood,
                    address.suburb,
                    address.village,
                    address.town,
                    address.city,
                    address.county,
                    address.state
                ].find((name) => name && name !== "yes");
                const locationName =
                    result.name ||
                    addressName ||
                    result.display_name?.split(",")[0];

                if (!locationName) {
                    throw new Error("ไม่พบชื่อสถานที่บริเวณที่เลือก กรุณากรอกชื่อสถานที่เอง");
                }

                setForm((currentForm) => ({
                    ...currentForm,
                    location_name: locationName
                }));
            })
            .catch((error) => {
                if (error.name === "AbortError") return;

                console.error("Reverse geocoding error:", error);

                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "warning",
                    title: error.message || "ค้นหาชื่อสถานที่ไม่สำเร็จ กรุณากรอกชื่อสถานที่เอง",
                    showConfirmButton: false,
                    timer: 3000
                });
            })
            .finally(() => {
                if (geocodingRequestRef.current === controller) {
                    geocodingRequestRef.current = null;
                    setResolvingLocationName(false);
                }
            });

    };

    useEffect(() => () => {
        geocodingRequestRef.current?.abort();
    }, []);
        // ==========================
    // บันทึกข้อมูล
    // ==========================

    const saveLocation = async () => {

        if (!form.location_name.trim()) {

            return Swal.fire({

                icon: "warning",

                title: "กรุณากรอกชื่อสถานที่"

            });

        }

        if (!form.latitude.trim()) {

            return Swal.fire({

                icon: "warning",

                title: "กรุณากรอก Latitude"

            });

        }

        if (!form.longitude.trim()) {

            return Swal.fire({

                icon: "warning",

                title: "กรุณากรอก Longitude"

            });

        }

        try {

            setLoading(true);

            const payload = {

                location_name: form.location_name,

                latitude: Number(form.latitude),

                longitude: Number(form.longitude)

            };

            if (isEdit) {

                await api.put(

                    `/locations/${id}`,

                    payload

                );

            }

            else {

                await api.post(

                    "/locations",

                    payload

                );

            }

            Swal.fire({

                icon: "success",

                title:

                    isEdit

                        ? "แก้ไขสถานที่สำเร็จ"

                        : "เพิ่มสถานที่สำเร็จ",

                timer: 1500,

                showConfirmButton: false

            });

            navigate(

                "/dashboard/locations"

            );

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
        return (

        <AdminLayout>

            <div className="container-fluid">

                <div className="d-flex justify-content-between align-items-center mb-4">

                    <button

                        className="btn btn-outline-secondary"

                        onClick={() =>

                            navigate("/dashboard/locations")

                        }

                    >

                        กลับ

                    </button>

                </div>

                <div className="row">

                    <div className="col-lg-4">

                        <div className="card shadow border-0 rounded-4">

                            <div className="card-body">

                                <h5 className="fw-bold mb-4">

                                    ข้อมูลสถานที่

                                </h5>

                                {/* ชื่อสถานที่ */}

                                <div className="mb-3">

                                    <label className="form-label">

                                        ชื่อสถานที่

                                    </label>

                                    <input

                                        type="text"

                                        className="form-control"

                                        name="location_name"

                                        value={form.location_name}

                                        onChange={handleChange}

                                        placeholder="กรอกชื่อสถานที่"

                                    />

                                </div>

                                {/* Latitude */}

                                <div className="mb-3">

                                    <label className="form-label">

                                        Latitude

                                    </label>

                                    <input

                                        type="number"

                                        step="any"

                                        className="form-control"

                                        name="latitude"

                                        value={form.latitude}

                                        onChange={handleChange}

                                        placeholder="เช่น 17.291831"

                                    />

                                </div>

                                {/* Longitude */}

                                <div className="mb-4">

                                    <label className="form-label">

                                        Longitude

                                    </label>

                                    <input

                                        type="number"

                                        step="any"

                                        className="form-control"

                                        name="longitude"

                                        value={form.longitude}

                                        onChange={handleChange}

                                        placeholder="เช่น 104.112699"

                                    />

                                </div>

                                <button

                                    className="btn btn-success w-100"

                                    onClick={saveLocation}

                                    disabled={loading}

                                >

                                    {

                                        loading

                                            ? "กำลังบันทึก..."

                                            : isEdit

                                                ? "อัปเดตสถานที่"

                                                : "บันทึกสถานที่"

                                    }

                                </button>

                            </div>

                        </div>

                    </div>

                    {/* แผนที่ */}

                    <div className="col-lg-8">

                        <div className="card shadow border-0 rounded-4">

                            <div className="card-body">

                                <h5 className="fw-bold">

                                    แสดงตำแหน่งบนแผนที่

                                </h5>

                                <hr />

                                <LocationPicker

                                    position={

                                        form.latitude && form.longitude

                                            ? {

                                                lat: Number(form.latitude),

                                                lng: Number(form.longitude)

                                            }

                                            : null
                                    }

                                    setPosition={handleMapPositionChange}

                                    selectable

                                    label={form.location_name}

                                />

                                <div className="mt-3 p-3 rounded-3 bg-light border">
                                    <div className="fw-bold text-success">
                                        {resolvingLocationName
                                            ? "กำลังค้นหาชื่อสถานที่..."
                                            : form.location_name || "คลิกบนแผนที่เพื่อเลือกสถานที่"}
                                    </div>
                                    <small className="text-muted">
                                        คลิกตำแหน่งที่ต้องการบนแผนที่เพื่อปักหมุดและเติมชื่อสถานที่อัตโนมัติ
                                    </small>
                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </AdminLayout>

    );

}

export default AddLocation;
