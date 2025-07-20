import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import { ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet-arrowheads";
import "leaflet/dist/leaflet.css";
import "./App.css";

// Realistic car icon
const carIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/744/744465.png",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function VehicleSimulator({ route }) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [path, setPath] = useState([]);
  const map = useMap();
  const timerRef = useRef();
  useEffect(() => {
  if (!map || path.length < 2) return;

  // Remove old arrows
  if (map._arrowLayer) {
    map.removeLayer(map._arrowLayer);
  }

  // Create a new arrow layer with direction
  const arrowLayer = L.polyline(path, { color: "blue" }).arrowheads({
    size: "12px",
    frequency: "50px",
    fill: true
  });

  arrowLayer.addTo(map);
  map._arrowLayer = arrowLayer;
  }, [path, map]);
  const handleSliderChange = (e) => {
    const newIndex = parseInt(e.target.value, 10);
    setIndex(newIndex);
    setPath(route.slice(0, newIndex + 1).map(p => [p.latitude, p.longitude]));
  };

  // Update index every second
  useEffect(() => {
    if (!isPlaying) return;

    timerRef.current = setInterval(() => {
      setIndex((prev) => {
        const next = prev + 1;
        if (next < route.length) {
          return next;
        } else {
          clearInterval(timerRef.current);
          return prev;
        }
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isPlaying]);

  // Update map view and path
  useEffect(() => {
    if (route[index]) {
      map.setView([route[index].latitude, route[index].longitude]);
      setPath(route.slice(0, index + 1).map(p => [p.latitude, p.longitude]));
    }
  }, [index]);

  const progress = ((index / (route.length - 1)) * 100).toFixed(1);

  return (
    <>
      <div id="controls">
        <button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          id="slider"
          min="0"
          max={route.length - 1}
          value={index}
          onChange={handleSliderChange}
        />
        <div id="info">
          <div><strong>Lat:</strong> {route[index].latitude}</div>
          <div><strong>Lng:</strong> {route[index].longitude}</div>
          <div><strong>Time:</strong> {route[index].timestamp}</div>
        </div>
      </div>

      <Marker
        position={[route[index].latitude, route[index].longitude]}
        icon={carIcon}
      />
      <Polyline positions={path} color="blue" />
    </>
  );
}

function App() {
  const [route, setRoute] = useState([]);

  useEffect(() => {
    fetch("/dummy-route.json")
      .then((res) => res.json())
      .then((data) => {
        setRoute(data);
      });
  }, []);

  return (
    <div className="App">
      {route.length > 0 && (
        <MapContainer
          center={[route[0].latitude, route[0].longitude]}
          zoom={16}
          zoomControl={false} // disable default position
          style={{ height: "100vh", width: "100%", zIndex: 0 }}
        >  

          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />
          <ZoomControl position="bottomleft" />

          <VehicleSimulator route={route} />
          <VehicleSimulator route={route} />
        </MapContainer>
      )}
    </div>
  );
}

export default App;
