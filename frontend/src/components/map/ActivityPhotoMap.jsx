import { useEffect } from "react";
import {
    MapContainer,
    Marker,
    Popup,
    Tooltip,
    useMap
} from "react-leaflet";
import SatelliteTileLayers from "./SatelliteTileLayers";

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

const getDistanceMeters = (first, second) => {
    const latitudeDifference = (second.latitude - first.latitude) * Math.PI / 180;
    const longitudeDifference = (second.longitude - first.longitude) * Math.PI / 180;
    const haversine = Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(first.latitude * Math.PI / 180) *
        Math.cos(second.latitude * Math.PI / 180) *
        Math.sin(longitudeDifference / 2) ** 2;

    return 6371000 * 2 *
        Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

function FitMapToMarkers({ positions }) {
    const map = useMap();

    useEffect(() => {
        if (positions.length === 1) {
            map.setView(positions[0], 16);
            return;
        }

        if (positions.length > 1) {
            map.fitBounds(positions, { padding: [24, 24], maxZoom: 16 });
        }
    }, [map, positions]);

    return null;
}

function ActivityPhotoMap({ images = [], latitude, longitude, locations: activityLocations = [] }) {
    const locations = [];
    for (const location of activityLocations) {
        if (!isValidCoordinate(location.latitude, location.longitude)) {
            continue;
        }

        const mappedLocation = {
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
            name: location.label || location.location_name || "สถานที่ไม่ระบุ",
            imageCount: location.image_count || 0,
            capturedAt: null
        };
        const duplicate = locations.find((existing) =>
            getDistanceMeters(existing, mappedLocation) < 20
        );
        if (duplicate) {
            if (duplicate.name !== mappedLocation.name) {
                duplicate.name = `${duplicate.name}, ${mappedLocation.name}`;
            }
            duplicate.imageCount += mappedLocation.imageCount;
            continue;
        }

        locations.push(mappedLocation);
    }

    for (const image of images) {
        if (!isValidCoordinate(image.latitude, image.longitude)) {
            continue;
        }

        const imageLocation = {
            latitude: Number(image.latitude),
            longitude: Number(image.longitude)
        };
        const duplicate = locations.find((location) =>
            getDistanceMeters(location, imageLocation) < 20
        );
        if (duplicate) {
            duplicate.imageCount += 1;
            duplicate.capturedAt = duplicate.capturedAt || image.captured_at;
            continue;
        }

        const nearbyLocation = locations
            .map((location) => ({
                location,
                distance: getDistanceMeters(location, imageLocation)
            }))
            .filter((entry) => entry.distance < 75)
            .sort((first, second) => first.distance - second.distance)[0]?.location;
        const photoLocationCount = locations.filter((location) =>
            location.name.startsWith("ตำแหน่งจากรูป")
        ).length;

        locations.push({
            ...imageLocation,
            name: nearbyLocation?.name || `ตำแหน่งจากรูป ${photoLocationCount + 1}`,
            imageCount: 1,
            capturedAt: image.captured_at
        });
    }

    if (
        locations.length === 0 &&
        isValidCoordinate(latitude, longitude)
    ) {
        locations.push({
            latitude: Number(latitude),
            longitude: Number(longitude),
            name: "สถานที่จัดกิจกรรม",
            imageCount: 0,
            capturedAt: null
        });
    }

    const markers = locations.map((location) => ({
        ...location,
        position: [location.latitude, location.longitude]
    }));
    const positions = markers.map((location) => location.position);

    if (markers.length === 0) {
        return (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted px-3 text-center" style={{ minHeight: 320 }}>
                ไม่พบพิกัดจากรูปภาพหรือกิจกรรม
            </div>
        );
    }

    return (
        <MapContainer
            center={positions[0]}
            zoom={16}
            scrollWheelZoom={false}
            style={{ width: "100%", height: "320px" }}
        >
            <SatelliteTileLayers />
            <FitMapToMarkers positions={positions} />
            {markers.map((location, index) => (
                <Marker
                    key={`${location.position.join(",")}-${index}`}
                    position={location.position}
                >
                    <Tooltip direction="top" offset={[0, -12]} permanent>
                        {location.name}
                    </Tooltip>
                    <Popup>
                        <div>
                            <strong>{location.name}</strong>
                            {location.imageCount > 0 && (
                                <div>พิกัดจากรูป {location.imageCount} รูป</div>
                            )}
                            {location.capturedAt && (
                                <div>
                                    เวลาถ่าย: {new Date(location.capturedAt).toLocaleString("th-TH")}
                                </div>
                            )}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}

export default ActivityPhotoMap;
