import { TileLayer } from "react-leaflet";

function SatelliteTileLayers() {
    return (
        <>
            <TileLayer
                attribution="Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
            />
            <TileLayer
                attribution="Labels © Esri, HERE, Garmin, © OpenStreetMap contributors, and the GIS user community"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Reference_Overlay/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
            />
        </>
    );
}

export default SatelliteTileLayers;
