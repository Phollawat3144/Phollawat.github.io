import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    MapContainer,
    Marker,
    Popup,
    useMap
} from "react-leaflet";
import { FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";
import SatelliteTileLayers from "./SatelliteTileLayers";
import "../../assets/css/activityHistoryMap.css";

const isValidCoordinate = (latitude, longitude) => {
    if (
        latitude === null ||
        latitude === undefined ||
        latitude === "" ||
        longitude === null ||
        longitude === undefined ||
        longitude === ""
    ) {
        return false;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    return Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180;
};

function FitMapToMarkers({ positions }) {
    const map = useMap();

    useEffect(() => {
        if (positions.length === 1) {
            map.setView(positions[0], 15);
        } else if (positions.length > 1) {
            map.fitBounds(positions, { padding: [28, 28], maxZoom: 15 });
        }
    }, [map, positions]);

    return null;
}

function ActivityHistoryMap({ activities = [], formatDate }) {
    const [selectedLocationKey, setSelectedLocationKey] = useState(null);
    const locations = useMemo(() => {
        const groupedLocations = new Map();

        activities.forEach((activity) => {
            const activityLocations = Array.isArray(activity.locations)
                ? activity.locations.filter((location) =>
                    isValidCoordinate(location.latitude, location.longitude)
                )
                : [];
            const locationsWithFallback = activityLocations.length > 0
                ? activityLocations
                : isValidCoordinate(activity.latitude, activity.longitude)
                    ? [{
                        latitude: activity.latitude,
                        longitude: activity.longitude,
                        location_name: activity.location_name
                    }]
                    : [];

            locationsWithFallback.forEach((location) => {
                const latitude = Number(location.latitude);
                const longitude = Number(location.longitude);
                const key = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
                const existing = groupedLocations.get(key) || {
                    key,
                    position: [latitude, longitude],
                    name: location.location_name || location.label || activity.location_name || "สถานที่ไม่ระบุ",
                    activities: []
                };

                if (!existing.activities.some((item) => item.activity_id === activity.activity_id)) {
                    existing.activities.push(activity);
                }
                groupedLocations.set(key, existing);
            });
        });

        return Array.from(groupedLocations.values());
    }, [activities]);

    const selectedLocation = locations.find(
        (location) => location.key === selectedLocationKey
    );
    const displayedLocations = selectedLocation ? [selectedLocation] : locations;
    const positions = locations.map((location) => location.position);

    return (
        <section className="activity-history-section">
            <div className="activity-history-container">
                <header className="activity-history-heading">
                    <span className="activity-history-eyebrow">ACTIVITY LOCATIONS</span>
                    <h2>Activity Map</h2>
                    <p>เลือกหมุดบนแผนที่เพื่อดูกิจกรรมที่จัดขึ้น ณ สถานที่นั้น</p>
                </header>

                {locations.length === 0 ? (
                    <div className="activity-history-empty">
                        {activities.length === 0
                            ? "ยังไม่มีกิจกรรมที่ผ่านมา"
                            : "กิจกรรมที่ผ่านมาไม่มีข้อมูลพิกัดสำหรับแสดงบนแผนที่"}
                    </div>
                ) : (
                    <div className="activity-history-layout">
                        <div className="activity-history-map">
                            <MapContainer
                                center={positions[0]}
                                zoom={13}
                                scrollWheelZoom={false}
                                style={{ width: "100%", height: "100%" }}
                            >
                                <SatelliteTileLayers />
                                <FitMapToMarkers positions={positions} />
                                {locations.map((location) => (
                                    <Marker
                                        key={location.key}
                                        position={location.position}
                                        eventHandlers={{
                                            click: () => setSelectedLocationKey(location.key)
                                        }}
                                    >
                                        <Popup>
                                            <strong>{location.name}</strong>
                                            <div>
                                                {location.activities.length} กิจกรรม
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>

                        <div className="activity-history-results">
                            <div className="activity-history-results-heading">
                                <h3>
                                    {selectedLocation
                                        ? selectedLocation.name
                                        : "กิจกรรมตามตำแหน่ง"}
                                </h3>
                                {selectedLocation && (
                                    <button
                                        type="button"
                                        className="activity-history-show-all"
                                        onClick={() => setSelectedLocationKey(null)}
                                    >
                                        ดูทุกตำแหน่ง
                                    </button>
                                )}
                            </div>

                            {displayedLocations.map((location) => (
                                <div className="activity-history-location-group" key={location.key}>
                                    {!selectedLocation && (
                                        <h4>
                                            <FaMapMarkerAlt />
                                            {location.name}
                                        </h4>
                                    )}
                                    {location.activities.map((activity) => (
                                        <article
                                            className="activity-history-item"
                                            key={activity.activity_id}
                                        >
                                            <h5>{activity.activity_name}</h5>
                                            <p>
                                                <FaCalendarAlt />
                                                {formatDate(activity.activity_date)}
                                                {activity.start_time && (
                                                    <span>
                                                        {" "}· {String(activity.start_time).slice(0, 5)} น.
                                                    </span>
                                                )}
                                            </p>
                                            <Link to={`/gallery/${activity.activity_id}`}>
                                                ดูรายละเอียด →
                                            </Link>
                                        </article>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

export default ActivityHistoryMap;
