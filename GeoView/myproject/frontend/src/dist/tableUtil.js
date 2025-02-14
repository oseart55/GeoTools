import { markerLayers } from "../main";

const BORDER_SIZE = 4;
const panel = document.getElementById("tableContainer");
const tab = document.createElement("div");
const table = document.getElementById('myTable');
let isVisible = true;

tab.className = "tab";
tab.textContent = "▲"; // Arrow icon
panel.appendChild(tab);

let m_pos;
let isCollapsed = true;

function resize(e) {
    // if (isCollapsed) return; // Don't resize when collapsed

    const dy = m_pos - e.y;
    m_pos = e.y;
    panel.style.height = (parseInt(getComputedStyle(panel).height) + dy) + "px";
}

panel.addEventListener("mousedown", function (e) {
    if (e.offsetY < BORDER_SIZE) {
        m_pos = e.y;
        document.addEventListener("mousemove", resize, false);
    }
}, false);

document.addEventListener("mouseup", function () {
    document.removeEventListener("mousemove", resize, false);
}, false);

// Toggle function for opening/closing the panel
tab.addEventListener("click", function () {
    isCollapsed = !isCollapsed;
    if (isCollapsed) {
        toggleAttribution(isVisible);
        panel.classList.add("collapsed");
        tab.textContent = "▲"; // Change arrow direction when collapsed
    } else {
        toggleAttribution(!isVisible);
        panel.classList.remove("collapsed");
        tab.textContent = "▼"; // Change arrow direction when expanded
    }
});

function GetAssets(type, layer) {
    let selectedMarkers = [];
    const circleCenter = type === 'circle' ? layer.getLatLng() : null;
    const radius = type === 'circle' ? layer.getRadius() : null;
    const rectangleBounds = type === 'rectangle' ? layer.getBounds() : null;
    const polygonLatLngs = type === 'polygon' ? layer.getLatLngs()[0] : null; // Extract polygon coordinates

    markerLayers.eachLayer(marker => {
        if (!(marker instanceof L.Marker)) return;
        const markerLatLng = marker.getLatLng();

        switch (type) {
            case 'circle':
                if (markerLatLng.distanceTo(circleCenter) <= radius) {
                    selectedMarkers.push(marker);
                }
                break;
            case 'rectangle':
                if (rectangleBounds.contains(markerLatLng)) {
                    selectedMarkers.push(marker);
                }
                break;
            case 'polygon':
                if (layer.getBounds().contains(markerLatLng) && pointInPolygon(markerLatLng, polygonLatLngs)) {
                    selectedMarkers.push(marker);
                }
                break;
        }
    });
    DisplayAssetsInTable(selectedMarkers);
}


function DisplayAssetsInTable(markers) {
    panel.classList.remove("collapsed");
    isCollapsed = false;
    toggleAttribution(!isVisible);
    let tbody = table.querySelector('tbody');
    if (!tbody) {
        tbody = table.appendChild(document.createElement('tbody'));
    }
    const existingIds = new Set();
    tbody.querySelectorAll('tr td:first-child').forEach(td => {
        existingIds.add(td.textContent);
    });
    const fragment = document.createDocumentFragment();
    markers.forEach(marker => {
        const data = marker.data;
        if (existingIds.has(data.Asset_ID)) return; // Skip duplicates
        const row = document.createElement('tr');
        row.innerHTML = `
            <td id="asset_id">${data.Asset_ID}</td>
            <td id="asset_name">${data.Asset_Name}</td>
            <td id="asset_location">${data.Location}</td>
            <td id="asset_details">${data.Details}</td>
        `;
        row.addEventListener('dblclick', function (e) {
            console.log(e.target.parentNode);
        });
        fragment.appendChild(row);
    });
    tbody.appendChild(fragment); // Batch insert to reduce reflows
}

function toggleAttribution(show) {
    var attribution = document.querySelector('.leaflet-control-attribution');
    if (attribution) {
        if (show) {
            attribution.classList.remove('hidden-attribution');
        } else {
            attribution.classList.add('hidden-attribution');
        }
    }
}

function pointInPolygon(point, polygonLatLngs) {
    let x = point.lat, y = point.lng;
    let inside = false;

    for (let i = 0, j = polygonLatLngs.length - 1; i < polygonLatLngs.length; j = i++) {
        let xi = polygonLatLngs[i].lat, yi = polygonLatLngs[i].lng;
        let xj = polygonLatLngs[j].lat, yj = polygonLatLngs[j].lng;

        let intersect = ((yi > y) !== (yj > y)) &&
                        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}

export {
    GetAssets
}