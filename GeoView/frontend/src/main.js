import './style.css';
import './dist/tableUtil.js'
import { editableLayers } from './dist/drawUtil.js'
import { AddMapDrawEvent } from './dist/eventsUtil.js';
import { displayGeoJSON } from './dist/loadFilesUtil.js';
import { SearchButton, SearchControl, HelpButton, SettingsButton } from './dist/controlUltil.js';

document.addEventListener("dragover", (event) => {
    event.preventDefault(); // Prevents file from being opened in a new window
    event.dataTransfer.dropEffect = "copy";
});

document.addEventListener("drop", (event) => {
    event.preventDefault();

    const file = event.dataTransfer.files[0]; // Get dropped file
    if (file && file.type === "application/json") {
        const reader = new FileReader();
        reader.onload = function (e) {
            const geojsonData = e.target.result;
            window.runtime.EventsEmit("geojson-file-dropped", { fileName: file.name, data: geojsonData });
        };
        reader.readAsText(file);
    }
});

const worker = new Worker(new URL('./dist/worker/markerWorker.js', import.meta.url), { type: "module" });
worker.onmessage = function (e) {
    const markers = e.data;
    // Use marker clustering for performance
    // let markerCluster = L.markerClusterGroup();
    markers.forEach(({ lat, lng, data }) => {
        let marker = L.marker([lat, lng]);
        marker.data = data;
        // markerCluster.addLayer(marker);
        markerLayers.addLayer(marker);
    });
    fetch('https://raw.githubusercontent.com/oseart55/GeoTools/refs/heads/main/Files/us-states.json')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data).addTo(statesLayer);
            SearchControl.addTo(map);
        })
        .catch(error => console.error('Error loading GeoJSON:', error));
};


let globalSettings;
var markerLayers = new L.FeatureGroup();
var statesLayer = new L.FeatureGroup();

var ll = new L.LatLng(37.396346, -110.895996)
var osm = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
});
var editableLayersGroup = L.layerGroup([markerLayers, editableLayers]);

var baseMaps = {
    "CartoDB Dark": osm,
};

var overlayMaps = {
    "US States": statesLayer,
    "Markers": markerLayers
};

var map = L.map('map', {
    center: ll,
    zoom: 5,
    layers: [osm, editableLayersGroup],
    contextmenu: true,
    contextmenuWidth: 140,
    contextmenuItems: [{
        text: 'Show coordinates',
        callback: showCoordinates
    }, {
        text: 'Center map here',
        callback: centerMap
    }, '-', {
        text: 'Zoom in',
        icon: 'https://raw.githubusercontent.com/oseart55/GeoTools/main/Images/zoom-in.png',
        callback: zoomIn
    }, {
        text: 'Zoom out',
        icon: 'https://raw.githubusercontent.com/oseart55/GeoTools/main/Images/zoom-out.png',
        callback: zoomOut
    }]
});

var layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);
AddMapDrawEvent()
worker.postMessage(1000);
SearchButton.addTo(map);
HelpButton.addTo(map);
SettingsButton.addTo(map);



// Listen for GeoJSON data from the backend
window.runtime.EventsOn("geojsonLoaded", (geojsonString) => {
    let layer = displayGeoJSON(geojsonString);
    layer.addTo(editableLayersGroup);
    map.fitBounds(layer.getBounds())
});

window.runtime.EventsOn("toggleHelpButton", (isVisible) => {
    isVisible == true ? map.addControl(HelpButton) : map.removeControl(HelpButton);
    changeDisplaySetting("displayHelp", isVisible)
    window.runtime.EventsEmit("toggleHelpButton");
});

window.runtime.EventsOn("toggleSettingsButton", (isVisible) => {
    isVisible == true ? map.addControl(SettingsButton) : map.removeControl(SettingsButton);
    changeDisplaySetting("displaySettings", isVisible)
    window.runtime.EventsEmit("toggleSettingsButton");
});

window.runtime.EventsOn("toggleAutoUpdateButton", (isVisible) => {
    changeDisplaySetting("autoUpdate", isVisible)
    window.runtime.EventsEmit("toggleAutoUpdateButton");
});

window.runtime.EventsOn("Reload", () => {
    location.reload();
});

window.runtime.EventsOn("settingsLoaded", (settingsJSON) => {
    try {
        const s = JSON.parse(atob(settingsJSON.replaceAll('"', '')));
        globalSettings = s;
        s.user.displayHelp == true ? map.addControl(HelpButton) : map.removeControl(HelpButton);
        s.user.displaySettings == true ? map.addControl(SettingsButton) : map.removeControl(SettingsButton);

    } catch (error) {
        console.error("Failed to parse settings JSON:", error);
    }
});

window.runtime.EventsOn("geojson-fileDrop", (geojsonString) => {
    try {
        const geojson = JSON.parse(geojsonString);
        addGeoJSONToMap(geojson);
    } catch (error) {
        console.error("Invalid GeoJSON:", error);
    }
});

window.runtime.EventsOn("geojson-loaded", (geoJsonData) => {
    const data = JSON.parse(geoJsonData.data);

    try {
        addGeoJSONToMap(data, geoJsonData.fileName);
    } catch (error) {
        console.error("Invalid GeoJSON:", error);
    }
});

function addGeoJSONToMap(geojson, fileName) {
    overlayMaps[fileName] = L.geoJSON(geojson).addTo(map);
    layerControl.remove();
    layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);
}

async function saveSettings(newSettings) {
    try {
        const settingsJSON = JSON.stringify(newSettings);
        await window.runtime.EventsEmit("saveSettings", settingsJSON);
        console.log("Settings change notified to backend.");
    } catch (error) {
        console.error("Error notifying backend:", error);
    }
}

function changeDisplaySetting(setting, value) {
    globalSettings.user[setting] = value;
    saveSettings(globalSettings)
    L.DomEvent.stopPropagation();
}


function showCoordinates(e) {
    alert(e.latlng);
}

function centerMap(e) {
    map.panTo(e.latlng);
}

function zoomIn(e) {
    map.zoomIn();
}

function zoomOut(e) {
    map.zoomOut();
}

export {
    map,
    editableLayers,
    markerLayers,
    statesLayer,
    editableLayersGroup,

}