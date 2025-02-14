import './style.css';
import { editableLayers } from './dist/drawUtil.js'
import './dist/tableUtil.js'
import { SearchButton, SearchControl, HelpButton, SettingsButton } from './dist/controlUltil.js';
import { AddMapDrawEvent } from './dist/eventsUtil.js';
import { displayGeoJSON } from './dist/loadFilesUtil.js';

let globalSettings;
var markerLayers = new L.FeatureGroup();
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
    "Editable Layers": editableLayersGroup
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
        icon: 'https://raw.githubusercontent.com/oseart55/GeoTools/main/zoom-in.png',
        callback: zoomIn
    }, {
        text: 'Zoom out',
        icon: 'https://raw.githubusercontent.com/oseart55/GeoTools/main/zoom-out.png',
        callback: zoomOut
    }]
});

AddMapDrawEvent()
SearchButton.addTo(map);
SearchControl.addTo(map);
HelpButton.addTo(map);
SettingsButton.addTo(map);

var layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);




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
};
worker.postMessage(1000);

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

window.runtime.EventsOn("Reload", () => {
    location.reload();
});

window.runtime.EventsOn("settingsLoaded", (settingsJSON) => {
    try {
        const s = JSON.parse(atob(settingsJSON.replaceAll('"','')));
        globalSettings = s;
        s.user.displayHelp == true ? map.addControl(HelpButton) : map.removeControl(HelpButton);
        s.user.displaySettings == true ? map.addControl(SettingsButton) : map.removeControl(SettingsButton);

    } catch (error) {
        console.error("Failed to parse settings JSON:", error);
    }
});

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
    editableLayersGroup,

}