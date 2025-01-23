import Map from 'https://cdn.skypack.dev/ol/Map.js';
import Feature from 'https://cdn.skypack.dev/ol/Feature.js';
import Point from 'https://cdn.skypack.dev/ol/geom/Point.js';
import VectorSource from 'https://cdn.skypack.dev/ol/source/Vector.js';
import {Vector as VectorLayer} from 'https://cdn.skypack.dev/ol/layer.js';
import View from 'https://cdn.skypack.dev/ol/View.js';
import TileLayer from 'https://cdn.skypack.dev/ol/layer/Tile.js';
import OSM from 'https://cdn.skypack.dev/ol/source/OSM.js';
import { fromLonLat, toLonLat } from "https://cdn.skypack.dev/ol/proj.js";
import { createMarkerElement } from "./javascript/controller/marker.js";
import Overlay from "https://cdn.skypack.dev/ol/Overlay.js";
import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11/src/sweetalert2.js";
import { addCSS } from "https://cdn.jsdelivr.net/gh/jscroot/lib@0.0.9/element.js";
import {Icon, Style} from 'https://cdn.skypack.dev/ol/style.js';

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

// Static data for predefined locations
const staticLocations = [
  // {
  //   name: "Bandung City Hall",
  //   coordinate: [107.6098, -6.9175],
  //   content: "<strong>Bandung City Hall</strong><br>Koordinat: -6.9175, 107.6098",
  // },
  // {
  //   name: "Gedung Sate",
  //   coordinate: [107.6191, -6.9025],
  //   content: "<strong>Gedung Sate</strong><br>Koordinat: -6.9025, 107.6191",
  // },
  // {
  //   name: "Trans Studio Bandung",
  //   coordinate: [107.6348, -6.9266],
  //   content: "<strong>Trans Studio Bandung</strong><br>Koordinat: -6.9266, 107.6348",
  // },
];

// Render static locations on the map
function renderStaticMarkers() {
  staticLocations.forEach((location) => {
    addMarkerToMap(location.name, location.coordinate);
  });
}

// Add static markers on map initialization
renderStaticMarkers();

const markerOverlay = new Overlay({
  element: createMarkerElement(),
  positioning: "center-center",
  stopEvent: false,
});
map.addOverlay(markerOverlay);

// Retrieve existing data from localStorage
const savedLocations = JSON.parse(localStorage.getItem("locations")) || [];

// Function to save data locally
function saveLocation(name, mapCoordinate) {
  const lonLatCoordinate = toLonLat(mapCoordinate); // Convert to lon/lat
  const location = {
    name,
    coordinate: lonLatCoordinate, // Store in lon/lat format
    content: `<strong>${name}</strong><br>Koordinat: ${lonLatCoordinate[1].toFixed(5)}, ${lonLatCoordinate[0].toFixed(5)}`,
  };
  savedLocations.push(location);

  // Save updated locations to localStorage
  localStorage.setItem("locations", JSON.stringify(savedLocations));
  console.log("Saved locations:", savedLocations);
}

function addMarkerToMap(name, lonLatCoordinate) {
  const mapCoordinate = fromLonLat(lonLatCoordinate); // Convert back to map projection
  const marker = new Overlay({
    position: mapCoordinate,
    element: createMarkerElement(),
    positioning: "center-center",
    stopEvent: false,
  });
  map.addOverlay(marker);

  const markerElement = marker.getElement();
  markerElement.title = name;
  markerElement.style.cursor = "pointer";

  markerElement.addEventListener("click", () => {
    Swal.fire({
      title: "Detail Lokasi",
      html: `<strong>Nama:</strong> ${name}<br><strong>Koordinat:</strong> ${lonLatCoordinate[1].toFixed(
        5
      )}, ${lonLatCoordinate[0].toFixed(5)}`,
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
  console.log("Clicked map coordinates (EPSG:3857):", clickedCoord);
  console.log("Clicked coordinates converted to lon/lat (EPSG:4326):", toLonLat(clickedCoord));

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
      saveLocation(locationName, clickedCoord); // Save map coordinates
      addMarkerToMap(locationName, toLonLat(clickedCoord)); // Add marker using lon/lat
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

function displayPopupForCoordinate(coordinate, content) {
  const popupElement = document.getElementById("popup-content-container");
  popupElement.innerHTML = content;

  // Position the map and display the sidebar
  map.getView().animate({ center: fromLonLat(coordinate), zoom: 17 });

  const popupSidebar = document.getElementById("popup-sidebar");
  popupSidebar.style.display = "block";
}

function addUserLocationMarker() {

  const geolocationOptions = {
    enableHighAccuracy: true,
    timeout: 15000, // Adjust as needed
    maximumAge: 0,
  };

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoordinates = [position.coords.longitude, position.coords.latitude];
        console.log("Accurate user coordinates:", userCoordinates);
        console.log("Koordinat pengguna:", userCoordinates);

        // Add user marker
        const userMarker = new Feature({
          geometry: new Point(fromLonLat(userCoordinates)),
        });

        userMarker.setStyle(
          new Style({
            image: new Icon({
              anchor: [0.5, 1],
              src: "https://cdn-icons-png.freepik.com/512/8239/8239169.png",
              scale: 0.1,
            }),
          })
        );

        const vectorSource = new VectorSource({ features: [userMarker] });
        const vectorLayer = new VectorLayer({ source: vectorSource });

        map.addLayer(vectorLayer);

        map.getView().setCenter(fromLonLat(userCoordinates));
        map.getView().setZoom(17);

        // Find nearest parking
        findNearestParking(userCoordinates);
      },
      (error) => {
        console.error("Error mendapatkan lokasi pengguna:", error);
        Swal.fire({
          title: "Lokasi Tidak Ditemukan",
          text: "Aktifkan lokasi Anda untuk melanjutkan.",
          icon: "warning",
        });
      },
      geolocationOptions
    );
  }
}


// Fungsi untuk menghitung jarak antara dua koordinat (Haversine formula)
function calculateDistance(coord1, coord2) {
  console.log("Koordinat 1:", coord1);
  console.log("Koordinat 2:", coord2);

  const toRadians = (degree) => degree * (Math.PI / 180);

  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371; // Radius bumi dalam kilometer
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
          Math.cos(toRadians(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  console.log("Jarak yang dihitung:", distance, "km");
  return distance;
}

// Fungsi untuk menemukan lokasi parkir terdekat
function findNearestParking(userCoordinates) {
  console.log("Lokasi pengguna:", userCoordinates);

  if (!savedLocations || savedLocations.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Tidak Ada Lokasi Tersimpan",
      text: "Anda belum menyimpan lokasi apa pun. Klik di peta untuk menambahkan lokasi baru.",
    });
    return;
  }

  let nearestLocation = null;
  let minDistance = Infinity;

  savedLocations.forEach(({ coordinate, name }) => {
    if (!coordinate || coordinate.length !== 2) return;

    const distance = calculateDistance(userCoordinates, coordinate);

    if (distance < minDistance) {
      minDistance = distance;
      nearestLocation = { coordinate, name };
    }
  });

  if (nearestLocation) {
    // Show the nearest parking location in a SweetAlert
    Swal.fire({
      icon: "success",
      title: "Lokasi Terdekat Telah Ditemukan!",
      html: `
        <strong>Nama:</strong> ${nearestLocation.name}<br>
        <strong>Koordinat:</strong> ${nearestLocation.coordinate[1].toFixed(5)}, ${nearestLocation.coordinate[0].toFixed(5)}<br>
        <strong>Jarak:</strong> ${minDistance.toFixed(2)} km
      `,
    });

    // Optionally, zoom the map to the nearest location
    map.getView().animate({
      center: fromLonLat(nearestLocation.coordinate),
      zoom: 17,
    });
  } else {
    Swal.fire({
      icon: "warning",
      title: "Tidak Ada Lokasi Parkir",
      text: "Tidak ada lokasi parkir terdekat yang ditemukan.",
    });
  }
}


function getAccurateUserLocation() {
  if (navigator.geolocation) {
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoordinates = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        console.log("User location:", userCoordinates);
        
        // Call to find and display the nearest location
        findNearestParking(userCoordinates); 
      },
      (error) => {
        console.error("Error fetching user location:", error);
        Swal.fire({
          icon: "warning",
          title: "Failed to Access Location",
          text: "Ensure location permissions are enabled.",
        });
      },
      options
    );
  } else {
    Swal.fire({
      icon: "warning",
      title: "Geolocation Not Supported",
      text: "Your browser does not support geolocation.",
    });
  }
}


document.addEventListener("DOMContentLoaded", () => {
  renderSavedMarkers();
  getAccurateUserLocation();
  addUserLocationMarker();
});