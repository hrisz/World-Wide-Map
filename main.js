import Map from 'https://cdn.skypack.dev/ol/Map.js';
import View from 'https://cdn.skypack.dev/ol/View.js';
import TileLayer from 'https://cdn.skypack.dev/ol/layer/Tile.js';
import OSM from 'https://cdn.skypack.dev/ol/source/OSM.js';
import { fromLonLat, toLonLat } from "https://cdn.skypack.dev/ol/proj.js";
import { createMarkerElement } from "./javascript/controller/marker.js";
import Overlay from "https://cdn.skypack.dev/ol/Overlay.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/src/sweetalert2.js";
import { addCSS } from "https://cdn.jsdelivr.net/gh/jscroot/lib@0.0.9/element.js";

addCSS("https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.css");

const map = new Map({
  target: "map",
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  view: new View({
    center: fromLonLat([107.6098, -6.9175]),
    zoom: 9,
  }),
});

const markerOverlay = new Overlay({
  element: createMarkerElement(),
  positioning: "center-center",
  stopEvent: false,
});
map.addOverlay(markerOverlay);

// Retrieve existing data from localStorage
const savedLocations = JSON.parse(localStorage.getItem("locations")) || [];

// Function to save data locally
function saveLocation(name, coordinate) {
  const location = {
    name,
    coordinate: toLonLat(coordinate), // Convert to longitude/latitude
  };
  savedLocations.push(location);

  // Save updated locations to localStorage
  localStorage.setItem("locations", JSON.stringify(savedLocations));
  console.log("Saved locations:", savedLocations);
}

// Function to add a marker to the map
function addMarkerToMap(name, coordinate) {
  const marker = new Overlay({
    position: fromLonLat(coordinate), // Convert back to map projection
    element: createMarkerElement(),
    positioning: "center-center",
    stopEvent: false,
  });
  map.addOverlay(marker);

  const markerElement = marker.getElement();
  markerElement.title = name; // Adds a tooltip
  markerElement.style.cursor = "pointer"; // Change cursor to pointer on hover

  // Add a click event listener to show data
  markerElement.addEventListener("click", () => {
    Swal.fire({
      title: "Detail Lokasi",
      html: `<strong>Nama:</strong> ${name}<br><strong>Koordinat:</strong> ${coordinate[1].toFixed(
        5
      )}, ${coordinate[0].toFixed(5)}`,
      icon: "info",
    });
  });
}

// Render saved markers on map initialization
function renderSavedMarkers() {
  savedLocations.forEach((location) => {
    addMarkerToMap(location.name, location.coordinate);
  });
}

// Map click handler
map.on("click", (event) => {
  const clickedCoord = event.coordinate;
  markerOverlay.setPosition(clickedCoord);

  Swal.fire({
    title: "Masukkan Nama Lokasi",
    input: "text",
    inputLabel: "LOKASI:",
    inputPlaceholder: "Masukkan nama lokasi",
    showCancelButton: true,
    inputValidator: (value) => {
      if (!value) {
        return "Kamu belum memasukkan apa-apa!";
      }
    },
    focusConfirm: false,
  }).then((result) => {
    if (result.isConfirmed) {
      const locationName = result.value;
      saveLocation(locationName, toLonLat(clickedCoord)); // Save in lon/lat
      addMarkerToMap(locationName, toLonLat(clickedCoord)); // Add marker
      Swal.fire(
        "Tersimpan!",
        `Lokasi "${locationName}" berhasil disimpan.`,
        "success"
      );
    }
  });
});

// Render previously saved markers
renderSavedMarkers();
