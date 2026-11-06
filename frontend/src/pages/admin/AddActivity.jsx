// จุดประสงค์: สร้างหรือแก้ไขกิจกรรม พร้อมจัดการข้อมูลสถานที่และสื่อ
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { FaCloudUploadAlt, FaImages, FaPlus, FaTimes } from "react-icons/fa";

import AdminLayout from "../../layouts/AdminLayout";
import LocationPicker from "../../components/map/LocationPicker";
import api from "../../services/api";

const findNearbyLocation = (locations, latitude, longitude) => {
    const latitudeValue = Number(latitude);
    const longitudeValue = Number(longitude);
    if (
        latitude === null ||
        latitude === undefined ||
        latitude === "" ||
        longitude === null ||
        longitude === undefined ||
        longitude === "" ||
        !Number.isFinite(latitudeValue) ||
        !Number.isFinite(longitudeValue) ||
        Math.abs(latitudeValue) > 90 ||
        Math.abs(longitudeValue) > 180
    ) {
        return null;
    }

    const earthRadiusMeters = 6371000;
    let nearestLocation = null;
    let nearestDistance = 75;

    for (const location of locations) {
        const locationLatitude = Number(location.latitude);
        const locationLongitude = Number(location.longitude);
        if (
            !location.location_name ||
            location.latitude === null ||
            location.latitude === undefined ||
            location.latitude === "" ||
            location.longitude === null ||
            location.longitude === undefined ||
            location.longitude === "" ||
            !Number.isFinite(locationLatitude) ||
            !Number.isFinite(locationLongitude) ||
            Math.abs(locationLatitude) > 90 ||
            Math.abs(locationLongitude) > 180
        ) {
            continue;
        }

        const latitudeDifference = (locationLatitude - latitudeValue) * Math.PI / 180;
        const longitudeDifference = (locationLongitude - longitudeValue) * Math.PI / 180;
        const haversine = Math.sin(latitudeDifference / 2) ** 2 +
            Math.cos(latitudeValue * Math.PI / 180) *
            Math.cos(locationLatitude * Math.PI / 180) *
            Math.sin(longitudeDifference / 2) ** 2;
        const distance = 2 * earthRadiusMeters *
            Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

        if (distance < nearestDistance) {
            nearestLocation = location;
            nearestDistance = distance;
        }
    }

    return nearestLocation;
};

const findNearbyLocationName = (locations, latitude, longitude) =>
    findNearbyLocation(locations, latitude, longitude)?.location_name || null;

const getDistanceMeters = (first, second) => {
    const latitudeDifference = (Number(second.latitude) - Number(first.latitude)) * Math.PI / 180;
    const longitudeDifference = (Number(second.longitude) - Number(first.longitude)) * Math.PI / 180;
    const haversine = Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(Number(first.latitude) * Math.PI / 180) *
        Math.cos(Number(second.latitude) * Math.PI / 180) *
        Math.sin(longitudeDifference / 2) ** 2;

    return 6371000 * 2 *
        Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const getPhotoLocations = (images, locations, selectedPositions) => {
    const photoLocations = [];

    for (const image of images) {
        const latitude = Number(image.latitude);
        const longitude = Number(image.longitude);
        if (
            image.latitude === null ||
            image.latitude === undefined ||
            image.longitude === null ||
            image.longitude === undefined ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            Math.abs(latitude) > 90 ||
            Math.abs(longitude) > 180
        ) {
            continue;
        }

        const coordinate = { latitude, longitude };
        if (selectedPositions.some((position) =>
            getDistanceMeters(coordinate, {
                latitude: position.lat,
                longitude: position.lng
            }) < 20
        )) {
            continue;
        }

        const duplicate = photoLocations.find((location) =>
            getDistanceMeters(coordinate, location) < 20
        );
        if (duplicate) {
            duplicate.imageCount += 1;
            continue;
        }

        photoLocations.push({
            ...coordinate,
            label: findNearbyLocationName(locations, latitude, longitude) ||
                `ตำแหน่งจากรูป ${photoLocations.length + 1}`,
            imageCount: 1
        });
    }

    return photoLocations;
};

function AddActivity() {

    const navigate = useNavigate();

    const { id } = useParams();

    const isEdit = !!id;

    const emptyForm = {

        activity_name: "",

        activity_date: "",

        start_time: "",

        end_time: "",

        description: "",

        location_id: "",

        location_ids: [],

        latitude: "",

        longitude: ""

    };

    // สถานะและข้อมูลที่คอมโพเนนต์ใช้

    const [form, setForm] = useState(emptyForm);

    const [locations, setLocations] = useState([]);

    const [images, setImages] = useState([]);

    const [previews, setPreviews] = useState([]);

    const [position, setPosition] = useState(null);
    const [manualPins, setManualPins] = useState([]);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const manualPinIdRef = useRef(0);
    const geocodingRequestsRef = useRef(new Set());
    const selectedLocationPositions = form.location_ids
        .map((locationId) => locations.find(
            (location) => String(location.location_id) === locationId
        ))
        .filter((location) =>
            location &&
            location.latitude !== null &&
            location.latitude !== "" &&
            location.longitude !== null &&
            location.longitude !== "" &&
            Number.isFinite(Number(location.latitude)) &&
            Number.isFinite(Number(location.longitude)) &&
            Math.abs(Number(location.latitude)) <= 90 &&
            Math.abs(Number(location.longitude)) <= 180
        )
        .map((location) => ({
            lat: Number(location.latitude),
            lng: Number(location.longitude),
            label: location.location_name
        }))
        .concat(manualPins.filter((pin) => pin.enabled).map((pin, index) => ({
            lat: pin.latitude,
            lng: pin.longitude,
            label: pin.label || `จุดปักเอง ${index + 1}`,
            alwaysShowLabel: true
        })));
    const photoLocations = getPhotoLocations(
        images,
        locations,
        selectedLocationPositions
    );
    const activityMapPositions = selectedLocationPositions.concat(
        photoLocations.map((location) => ({
            lat: location.latitude,
            lng: location.longitude,
            label: location.label,
            alwaysShowLabel: true
        }))
    );
    const selectedLocationNames = [
        ...form.location_ids
            .map((locationId) => locations.find(
                (location) => String(location.location_id) === locationId
            )?.location_name)
            .filter(Boolean),
        ...manualPins
            .filter((pin) => pin.enabled)
            .map((pin, index) => pin.label || `จุดปักเอง ${index + 1}`)
    ].join(", ");

    // โหลดข้อมูลและซิงก์ผลข้างเคียงกับวงจรชีวิตคอมโพเนนต์

    useEffect(() => {

        loadLocations();

        if (isEdit) {

            loadActivity();

        }

    }, []);

    useEffect(() => () => {
        geocodingRequestsRef.current.forEach((controller) => controller.abort());
    }, []);
    // ===========================
// โหลดสถานที่
// ===========================
const loadLocations = async () => {

    try {

        const res = await api.get("/locations");

        setLocations(res.data.data || []);

    }

    catch (err) {

        console.log(err);

    }

};

// ===========================
// โหลดข้อมูลกิจกรรม (Edit)
// ===========================
const loadActivity = async () => {

    try {

        const res = await api.get(

            `/activities/${id}`

        );

        if (!res.data.success || !res.data.data) {
            throw new Error(res.data.message || "ไม่พบข้อมูลกิจกรรม");
        }

        const data = res.data.data;
        const loadedManualPins = Array.isArray(data.custom_locations)
            ? data.custom_locations.map((pin) => ({
                id: ++manualPinIdRef.current,
                latitude: Number(pin.latitude),
                longitude: Number(pin.longitude),
                label: pin.label || "",
                enabled: true
            }))
            : [];
        setManualPins(loadedManualPins);

        setForm({

            activity_name: data.activity_name || "",

            activity_date: data.activity_date || "",

            start_time: data.start_time?.substring(0,5) || "",

            end_time: data.end_time?.substring(0,5) || "",

            description: data.description || "",

            location_id: data.location_id || "",

            location_ids: Array.isArray(data.location_ids)
                ? data.location_ids.map(String)
                : data.location_id
                    ? [String(data.location_id)]
                    : [],

            latitude: data.latitude || "",

            longitude: data.longitude || ""

        });

        // โหลดหมุด

        if (data.latitude && data.longitude) {

            setPosition({

                lat: Number(data.latitude),

                lng: Number(data.longitude)

            });

        }

        // โหลดรูป

        if (data.images && data.images.length > 0) {

            setImages(data.images);

            setPreviews(

                data.images.map(

                    img =>

                        "http://localhost:5000" +

                        img.image_path

                )

            );

        }

    }

    catch (err) {

        console.error("loadActivity error:", err);
        await Swal.fire({
            icon: "error",
            title: "โหลดข้อมูลกิจกรรมไม่สำเร็จ",
            text: err.response?.data?.message || err.message || "กรุณาลองใหม่อีกครั้ง"
        });
        navigate("/dashboard/activities");

    }

};

// ===========================
// เปลี่ยนค่า Input
// ===========================
const handleChange = (e) => {

    setForm({

        ...form,

        [e.target.name]: e.target.value

    });

};

// ===========================
// เลือกสถานที่
// ===========================
const handleLocationChange = (e) => {

    const changedLocationId = e.target.value;
    const currentLocationIds = form.location_ids || [];
    const nextLocationIds = e.target.checked
        ? [...currentLocationIds, changedLocationId]
        : currentLocationIds.filter((locationId) => locationId !== changedLocationId);
    const primaryLocationId = nextLocationIds[0] || "";

    const location = locations.find(

        item => String(item.location_id) === primaryLocationId

    );

    setForm({

        ...form,

        location_id: primaryLocationId,

        location_ids: nextLocationIds,

        latitude: location?.latitude || "",

        longitude: location?.longitude || ""

    });

    if (location) {

        setPosition({

            lat: Number(location.latitude),

            lng: Number(location.longitude)

        });

    } else {

        setPosition(null);

    }

};

const handleManualPin = ({ lat, lng }) => {
    const id = ++manualPinIdRef.current;
    const nearbyLocationName = findNearbyLocationName(locations, lat, lng);
    if (nearbyLocationName) {
        setManualPins((currentPins) => [
            ...currentPins,
            {
                id,
                latitude: lat,
                longitude: lng,
                label: nearbyLocationName,
                enabled: true
            }
        ]);
        return;
    }

    const controller = new AbortController();
    geocodingRequestsRef.current.add(controller);

    setManualPins((currentPins) => [
        ...currentPins,
        {
            id,
            latitude: lat,
            longitude: lng,
            label: "กำลังค้นหาชื่อสถานที่...",
            enabled: true
        }
    ]);

    const coordinates = new URLSearchParams({
        format: "jsonv2",
        zoom: "18",
        lat: String(lat),
        lon: String(lng),
        "accept-language": "th"
    });

    fetch(`https://nominatim.openstreetmap.org/reverse?${coordinates}`, {
        headers: { "Accept-Language": "th" },
        signal: controller.signal
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("ไม่สามารถค้นหาชื่อสถานที่จากแผนที่ได้");
            }

            return response.json();
        })
        .then((result) => {
            if (controller.signal.aborted) return;

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
            const label =
                result.name ||
                addressName ||
                result.display_name?.split(",")[0];

            if (!label) {
                throw new Error("ไม่พบชื่อสถานที่บริเวณที่ปักหมุด");
            }

            setManualPins((currentPins) =>
                currentPins.map((pin) => pin.id === id ? { ...pin, label } : pin)
            );
        })
        .catch((error) => {
            if (error.name === "AbortError") return;

            console.error("Reverse geocoding error:", error);
            setManualPins((currentPins) =>
                currentPins.map((pin) =>
                    pin.id === id ? { ...pin, label: "ไม่พบชื่อสถานที่" } : pin
                )
            );
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "warning",
                title: error.message || "ค้นหาชื่อสถานที่ไม่สำเร็จ",
                showConfirmButton: false,
                timer: 3000
            });
        })
        .finally(() => {
            geocodingRequestsRef.current.delete(controller);
        });
};

const removeManualPin = (pinId) => {
    setManualPins((currentPins) =>
        currentPins.filter((pin) => pin.id !== pinId)
    );
};

const toggleManualPin = (pinId) => {
    setManualPins((currentPins) =>
        currentPins.map((pin) =>
            pin.id === pinId ? { ...pin, enabled: !pin.enabled } : pin
        )
    );
};

// ===========================
// Upload รูป
// ===========================
const uploadImages = async (e) => {

    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    e.target.value = "";

    const uploadBatchSize = 100;

    setLoading(true);

    try {

        for (let startIndex = 0; startIndex < files.length; startIndex += uploadBatchSize) {

            const batch = files.slice(
                startIndex,
                startIndex + uploadBatchSize
            );

            const formData = new FormData();

            batch.forEach(file => {

                formData.append("images", file);

            });

            const res = await api.post(

                "/upload",

                formData,

                {

                    headers: {

                        "Content-Type":

                            "multipart/form-data"

                    }

                }

            );

            const uploadedFiles = res.data.files || [];
            const detectedLocationIds = uploadedFiles
                .map((file) => findNearbyLocation(
                    locations,
                    file.latitude,
                    file.longitude
                )?.location_id)
                .filter((locationId) => locationId !== null && locationId !== undefined)
                .map(String);

            if (detectedLocationIds.length > 0) {
                setForm((currentForm) => {
                    const locationIds = [...new Set([
                        ...currentForm.location_ids,
                        ...detectedLocationIds
                    ])];
                    const primaryLocation = locations.find(
                        (location) => String(location.location_id) === locationIds[0]
                    );

                    return {
                        ...currentForm,
                        location_id: locationIds[0] || "",
                        location_ids: locationIds,
                        latitude: primaryLocation?.latitude || "",
                        longitude: primaryLocation?.longitude || ""
                    };
                });
            }

            setImages(prev => [

                ...prev,

                ...uploadedFiles

            ]);

            setPreviews(prev => [

                ...prev,

                ...uploadedFiles.map(

                    img =>

                        "http://localhost:5000" +

                        img.path

                )

            ]);

        }

    }

    catch (err) {

        console.log(err);

    }

    finally {

        setLoading(false);

    }

};

// ===========================
// ลบรูป
// ===========================
const removeImage = (index) => {

    setImages(

        images.filter(

            (_, i) => i !== index

        )

    );

    setPreviews(

        previews.filter(

            (_, i) => i !== index

        )

    );

};

// ===========================
// ล้างรูปทั้งหมด
// ===========================
const clearImages = () => {

    setImages([]);

    setPreviews([]);

    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }

};
// ===========================
// Save Activity
// ===========================
const saveActivity = async () => {

    if (!form.activity_name.trim()) {

        return Swal.fire({

            icon: "warning",

            title: "กรุณากรอกชื่อกิจกรรม"

        });

    }

    if (!form.activity_date) {

        return Swal.fire({

            icon: "warning",

            title: "กรุณาเลือกวันที่"

        });

    }

    if (!form.start_time) {

        return Swal.fire({

            icon: "warning",

            title: "กรุณาเลือกเวลาเริ่ม"

        });

    }

    if (!form.end_time) {

        return Swal.fire({

            icon: "warning",

            title: "กรุณาเลือกเวลาสิ้นสุด"

        });

    }

    if (!form.location_ids.length && !manualPins.some((pin) => pin.enabled)) {

        return Swal.fire({

            icon: "warning",

            title: "กรุณาเลือกสถานที่หรือปักหมุดบนแผนที่"

        });

    }

    try {

        setLoading(true);

        const payload = {

            ...form,

            location_id: form.location_ids[0] || "",

            custom_locations: manualPins.filter((pin) => pin.enabled).map((pin) => ({
                latitude: pin.latitude,
                longitude: pin.longitude,
                label: pin.label
            })),

            images

        };

        if (isEdit) {

            await api.put(

                `/activities/${id}`,

                payload

            );

        }

        else {

            await api.post(

                "/activities",

                payload

            );

        }

        Swal.fire({

            icon: "success",

            title: isEdit

                ? "แก้ไขกิจกรรมสำเร็จ"

                : "เพิ่มกิจกรรมสำเร็จ",

            timer: 1500,

            showConfirmButton: false

        });

        navigate("/dashboard/activities");

    }

    catch (err) {

        console.log(err);

        Swal.fire({

            icon: "error",

            title: "เกิดข้อผิดพลาด",

            text:
                err.response?.data?.message ||
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

            {/* Header */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <button

                    className="btn btn-outline-secondary"

                    onClick={() =>

                        navigate("/dashboard/activities")

                    }

                >

                    กลับ

                </button>

            </div>

            <div className="row g-4">

                {/* Left */}

                <div className="col-12">

                    <div className="card shadow border-0 rounded-4">

                        <div className="card-body">

                            <h5 className="fw-bold mb-4">

                                ข้อมูลกิจกรรม

                            </h5>

                            {/* ชื่อกิจกรรม */}

                            <div className="mb-3">

                                <label className="form-label">

                                    ชื่อกิจกรรม

                                </label>

                                <input

                                    type="text"

                                    className="form-control"

                                    name="activity_name"

                                    value={form.activity_name}

                                    onChange={handleChange}

                                />

                            </div>

                            {/* วันที่ */}

                            <div className="mb-3">

                                <label className="form-label">

                                    วันที่

                                </label>

                                <input

                                    type="date"

                                    className="form-control"

                                    name="activity_date"

                                    value={form.activity_date}

                                    onChange={handleChange}

                                />

                            </div>

                            {/* เวลา */}

                            <div className="row">

                                <div className="col">

                                    <label className="form-label">

                                        เวลาเริ่ม

                                    </label>

                                    <input

                                        type="time"

                                        className="form-control"

                                        name="start_time"

                                        value={form.start_time}

                                        onChange={handleChange}

                                    />

                                </div>

                                <div className="col">

                                    <label className="form-label">

                                        เวลาสิ้นสุด

                                    </label>

                                    <input

                                        type="time"

                                        className="form-control"

                                        name="end_time"

                                        value={form.end_time}

                                        onChange={handleChange}

                                    />

                                </div>

                            </div>

                            {/* รายละเอียด */}

                            <div className="mt-3">

                                <label className="form-label">

                                    รายละเอียด

                                </label>

                                <textarea

                                    rows="5"

                                    className="form-control"

                                    name="description"

                                    value={form.description}

                                    onChange={handleChange}

                                />

                            </div>

                            {/* สถานที่ */}

                            <div className="mt-3">

                                <label className="form-label">

                                    สถานที่

                                </label>

                                <details className="activity-location-select">
                                    <summary className="form-select activity-location-select-trigger">
                                        <span title={selectedLocationNames}>
                                            {selectedLocationNames || "เลือกสถานที่"}
                                        </span>
                                    </summary>
                                    <div className="activity-location-select-menu">
                                        {locations.map((location, index) => {
                                            const locationId = String(location.location_id);
                                            const isSelected = form.location_ids.includes(locationId);

                                            return (
                                                <label
                                                    className={`activity-location-option${isSelected ? " selected" : ""}`}
                                                    key={location.location_id}
                                                >
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        value={locationId}
                                                        checked={isSelected}
                                                        onChange={handleLocationChange}
                                                    />
                                                    <span className="activity-location-number">
                                                        {index + 1}
                                                    </span>
                                                    <span className="activity-location-name">
                                                        {location.location_name}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                        {locations.length === 0 && (
                                            <span className="text-muted">
                                                ยังไม่มีสถานที่ กรุณาเพิ่มสถานที่ก่อนสร้างกิจกรรม
                                            </span>
                                        )}
                                    </div>
                                </details>
                                <small className="form-text text-muted">
                                    คลิกเลือกสถานที่ได้หลายแห่ง หรือคลิกบนแผนที่เพื่อปักหมุดเพิ่มเอง
                                </small>

                            </div>

                            {/* แผนที่ */}

                            <div className="mt-4">

                                <label className="form-label fw-bold">

                                    ตำแหน่งกิจกรรม

                                </label>

                                <LocationPicker

                                    position={position}

                                    positions={activityMapPositions}

                                    selectable
                                    onMapClick={handleManualPin}

                                />
                                {(manualPins.length > 0 || photoLocations.length > 0) && (
                                    <details className="activity-manual-pins">
                                        <summary className="activity-manual-pins-trigger">
                                            ตำแหน่งเพิ่มเติม ({manualPins.length + photoLocations.length})
                                        </summary>
                                        <div className="activity-manual-pins-list">
                                            {photoLocations.map((location) => (
                                                <div
                                                    className="d-flex align-items-center gap-2"
                                                    key={`photo-${location.latitude}-${location.longitude}`}
                                                >
                                                    <span className="badge bg-success">GPS</span>
                                                    <div className="flex-grow-1">
                                                        <div className="fw-semibold">{location.label}</div>
                                                        <small className="text-muted">
                                                            จากรูป GPS {location.imageCount} รูป · {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                                        </small>
                                                    </div>
                                                </div>
                                            ))}
                                            {manualPins.map((pin) => (
                                                <div
                                                    className={`d-flex align-items-center gap-2${pin.enabled ? "" : " opacity-50"}`}
                                                    key={pin.id}
                                                >
                                                    <input
                                                        className="form-check-input flex-shrink-0"
                                                        type="checkbox"
                                                        aria-label={`ใช้หมุด ${pin.label}`}
                                                        checked={pin.enabled}
                                                        onChange={() => toggleManualPin(pin.id)}
                                                    />
                                                    <div className="flex-grow-1">
                                                        <div className="fw-semibold">{pin.label}</div>
                                                        <small className="text-muted">
                                                            {pin.latitude.toFixed(6)}, {pin.longitude.toFixed(6)}
                                                        </small>
                                                    </div>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        type="button"
                                                        onClick={() => removeManualPin(pin.id)}
                                                    >
                                                        ลบ
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                )}

                            </div>

                        </div>

                    </div>

                </div>
                                {/* Right */}

                <div className="col-12">

                    <div className="card shadow border-0 rounded-4">

                        <div className="card-body p-4 p-lg-5">

                            <div className="d-flex justify-content-between align-items-center mb-4 gap-3">

                                <div>
                                    <h3 className="fw-bold mb-1" style={{ fontSize: 25 }}>
                                        <FaImages className="me-2" style={{ color: "#006664" }} />
                                        รูปกิจกรรม
                                    </h3>
                                    <div style={{ color: "#64748B", fontSize: 15 }}>
                                        เพิ่มรูปภาพได้ต่อเนื่อง
                                    </div>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                    <span style={{ background: "#E9F7F0", color: "#006664", borderRadius: 999, padding: "9px 16px", fontWeight: 700, whiteSpace: "nowrap" }}>
                                        {previews.length} รูป
                                    </span>

                                    <button
                                        type="button"
                                        onClick={clearImages}
                                        disabled={!previews.length || loading}
                                        style={{
                                            border: "1px solid #006664",
                                            background: "#fff",
                                            color: "#006664",
                                            borderRadius: 12,
                                            padding: "9px 16px",
                                            fontWeight: 700,
                                            cursor: previews.length ? "pointer" : "default",
                                            whiteSpace: "nowrap",
                                            opacity: previews.length ? 1 : 0.5
                                        }}
                                    >
                                        ลบรูปทั้งหมด
                                    </button>
                                </div>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={uploadImages}
                                style={{ display: "none" }}
                            />

                            {previews.length > 0 ? (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 20 }}>
                                    {previews.map((img, index) => (
                                        <div
                                            key={`${img}-${index}`}
                                            style={{
                                                position: "relative",
                                                aspectRatio: "1 / 1",
                                                borderRadius: 18,
                                                overflow: "hidden",
                                                background: "#fff",
                                                boxShadow: "0 8px 25px rgba(0,0,0,.08)"
                                            }}
                                        >
                                            <img
                                                src={img}
                                                alt="activity"
                                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                            />

                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                disabled={loading}
                                                title="ลบรูป"
                                                style={{
                                                    position: "absolute",
                                                    top: 10,
                                                    right: 10,
                                                    width: 42,
                                                    height: 42,
                                                    borderRadius: "50%",
                                                    border: "2px solid rgba(255,255,255,.95)",
                                                    background: "rgba(220,53,69,.92)",
                                                    color: "#fff",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: 18,
                                                    cursor: "pointer",
                                                    boxShadow: "0 4px 12px rgba(0,0,0,.2)"
                                                }}
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>
                                    ))}

                                    <div
                                        className="member-photo-upload-trigger member-activity-add-tile"
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => fileInputRef.current?.click()}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                fileInputRef.current?.click();
                                            }
                                        }}
                                    >
                                        <span className="activity-add-image-plus">
                                            <FaPlus />
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="member-photo-upload-trigger">
                                    <div className="member-photo-upload-icon">
                                        <FaCloudUploadAlt />
                                    </div>

                                    <div className="fs-5">เลือกรูปกิจกรรม</div>

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={loading}
                                        className="member-upload-btn border-0"
                                    >
                                        <FaImages className="me-2" />
                                        เพิ่มรูปภาพ
                                    </button>
                                </div>
                            )}

                            <div className="d-grid gap-3 mt-4">
                                <button
                                    type="button"
                                    className="member-upload-btn border-0 w-100"
                                    onClick={saveActivity}
                                    disabled={loading}
                                >
                                    <FaCloudUploadAlt className="me-2" />
                                    {loading
                                        ? "กำลังบันทึก..."
                                        : isEdit
                                            ? "อัปเดตกิจกรรม"
                                            : "บันทึกกิจกรรม"}
                                </button>
                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    </AdminLayout>

);

}

export default AddActivity;
