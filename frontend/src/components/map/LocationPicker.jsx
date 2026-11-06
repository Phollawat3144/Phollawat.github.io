// จุดประสงค์: แสดงแผนที่ดาวเทียมและเลือกพิกัดด้วยการคลิก
import { useEffect, useMemo } from "react";
import {
    MapContainer,
    Marker,
    Popup,
    Tooltip,
    useMap,
    useMapEvents
} from "react-leaflet";
import { UNIVERSITY_MAP_CENTER } from "./mapConstants";
import SatelliteTileLayers from "./SatelliteTileLayers";

function MapClickHandler({ selectable, setPosition, onMapClick }) {
    useMapEvents({
        click(event) {
            const selectedPosition = {
                lat: event.latlng.lat,
                lng: event.latlng.lng
            };

            if (onMapClick) {
                onMapClick(selectedPosition);
                return;
            }

            if (selectable && setPosition) {
                setPosition(selectedPosition);
            }
        }
    });

    return null;
}

function FitMapToMarkers({ markers, position }) {
    const map = useMap();

    useEffect(() => {
        if (markers.length > 1) {
            map.fitBounds(
                markers.map((marker) => [marker.lat, marker.lng]),
                { padding: [24, 24], maxZoom: 16 }
            );
            return;
        }

        const center = markers[0]
            ? [markers[0].lat, markers[0].lng]
            : position
                ? [position.lat, position.lng]
                : null;
        if (center) {
            map.setView(center, 16);
        }
    }, [map, markers, position]);

    return null;
}

function LocationPicker({
    position,
    positions = [],
    setPosition,
    selectable = false,
    onMapClick,
    label = "",
    mapHeight = 480
}) {
    const markers = useMemo(
        () => positions.length > 0
            ? positions
            : position
                ? [{ ...position, label }]
                : [],
        [positions, position, label]
    );
    const center = markers.length > 0
        ? [markers[0].lat, markers[0].lng]
        : [UNIVERSITY_MAP_CENTER.lat, UNIVERSITY_MAP_CENTER.lng];

    return (
        <MapContainer
            center={center}
            zoom={markers.length > 0 ? 16 : 15}
            scrollWheelZoom={false}
            style={{
                width: "100%",
                height: `${mapHeight}px`,
                borderRadius: "15px"
            }}
        >
            <SatelliteTileLayers />
            <FitMapToMarkers markers={markers} position={position} />
            <MapClickHandler
                selectable={selectable}
                setPosition={setPosition}
                onMapClick={onMapClick}
            />
            {markers.map((marker, index) => {
                const markerLabel = marker.label || label;
                return (
                    <Marker
                        key={`${marker.lat}-${marker.lng}-${index}`}
                        position={[marker.lat, marker.lng]}
                        title={markerLabel || `สถานที่ ${index + 1}`}
                    >
                        {marker.alwaysShowLabel && markerLabel ? (
                            <Tooltip direction="top" offset={[0, -12]} permanent>
                                {markerLabel}
                            </Tooltip>
                        ) : markers.length > 1 ? (
                            <Popup>
                                <strong>{markerLabel || `สถานที่ ${index + 1}`}</strong>
                            </Popup>
                        ) : markerLabel ? (
                            <Tooltip direction="top" offset={[0, -12]} permanent>
                                {markerLabel}
                            </Tooltip>
                        ) : null}
                    </Marker>
                );
            })}
        </MapContainer>
    );
}

export default LocationPicker;
