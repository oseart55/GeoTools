import { map, statesLayer } from "../main";
import { drawControl } from "./drawUtil";
import { editableLayersGroup } from "../main";
import { DisplayAssetsInTable } from "./tableUtil.js"

// Draw Control Button
L.Control.SearchButton = L.Control.extend({
    options: {
        position: 'topleft'
    },
    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-search');
        var button = L.DomUtil.create('a', 'leaflet-control-button', container);
        L.DomUtil.addClass(button, 'fa fa-search');
        L.DomEvent.disableClickPropagation(button);

        this._isSearching = false;

        L.DomEvent.on(button, 'click', () => {
            if (!this._isSearching) {
                map.addControl(drawControl);
                this._isSearching = true;
            } else {
                map.removeControl(drawControl);
                this._isSearching = false;
            }
        });

        container.title = "Geometry Search";
        return container;
    }
});

var SearchButton = new L.Control.SearchButton();

// // Status Control Button
// L.Control.StatusButton = L.Control.extend({
//     options: {
//         position: 'topright'
//     },
//     onAdd: function (map) {
//         var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
//         var button = L.DomUtil.create('a', 'leaflet-control-button', container);
//         var spinner = L.DomUtil.create('i', 'fa fa-spinner fa-spin', button);

//         L.DomEvent.disableClickPropagation(button);
//         container.title = "Loading";
//         return container;
//     }
// });

// var StatusButton = new L.Control.StatusButton();

//Help Button Control
L.Control.HelpButton = L.Control.extend({
    options: {
        position: 'topright'
    },
    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-help');
        var button = L.DomUtil.create('a', 'leaflet-control-button', container);
        L.DomUtil.addClass(button, 'fa fa-info-circle');
        L.DomEvent.disableClickPropagation(button);
        button.addEventListener("click", function (e) {
            modal.style.display = "flex";
            document.body.style.overflow = "hidden";
            const openModal = document.getElementById("openModal");
            const closeModal = document.getElementById("closeModal");
            const exitModal = document.getElementById("exitModal");

            function close() {
                modal.style.display = "none";
                document.body.style.overflow = "auto";
            }

            window.addEventListener("keydown", (event) => {
                if (event.key === "Escape" && modal.style.display != 'none') {
                    close();
                }
            });

            closeModal.addEventListener("click", close);
            exitModal.addEventListener("click", close);

        })

        container.title = "Help";
        return container;
    },
});

var HelpButton = new L.Control.HelpButton()


//Settings Button Control
L.Control.SettingsButton = L.Control.extend({
    options: {
        position: 'topright'
    },
    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-settings');
        var button = L.DomUtil.create('a', 'leaflet-control-button', container);
        var settingsModal = document.getElementById("settings");
        var tableContainerSizer = document.getElementById("tableContainerSizer");
        const panel = document.getElementById("tableContainer");
        let parent = panel.parentElement;
        L.DomUtil.addClass(button, 'fa fa-gear');
        L.DomEvent.disableClickPropagation(button);
        button.addEventListener("click", function (e) {
            panel.classList.remove("collapsed");
            let parentHeight;
            let elementHeight;
            panel.addEventListener("transitionend", function () {
                parentHeight = parent.clientHeight;
                elementHeight = (panel.clientHeight / parentHeight) * 100;
                tableContainerSizer.value = Math.round(elementHeight);
            }, { once: true }); // `once: true` ensures it runs only once

            // Set initial value
            tableContainerSizer.value = Math.round(elementHeight);

            // Make sure the event is not attached multiple times
            tableContainerSizer.addEventListener("change", function () {
                let newHeightPercentage = parseFloat(tableContainerSizer.value);

                if (!isNaN(newHeightPercentage)) {
                    let newHeightPx = (newHeightPercentage / 100) * parentHeight;
                    panel.style.height = `${newHeightPx}px`; // Apply new height
                }
            });

            settingsModal.style.display = "flex";
            document.body.style.overflow = "hidden";

            const closeModal = settingsModal.querySelector("#closeModal");
            const exitModal = settingsModal.querySelector("#exitModal");

            function close() {
                settingsModal.style.display = "none";
                document.body.style.overflow = "auto";
                panel.classList.add("collapsed");
            }

            window.addEventListener("keydown", (event) => {
                if (event.key === "ArrowUp" && document.activeElement.tagName === "INPUT") {
                    tableContainerSizer.value = parseInt(tableContainerSizer.value) + 1;
                    let newHeightPercentage = parseFloat(tableContainerSizer.value);

                    if (!isNaN(newHeightPercentage)) {
                        let newHeightPx = (newHeightPercentage / 100) * parentHeight;
                        panel.style.height = `${newHeightPx}px`; // Apply new height
                    }
                }
                if (event.key === "ArrowDown" && document.activeElement.tagName === "INPUT") {
                    tableContainerSizer.value = parseInt(tableContainerSizer.value) - 1;
                    let newHeightPercentage = parseFloat(tableContainerSizer.value);
                    if (!isNaN(newHeightPercentage)) {
                        let newHeightPx = (newHeightPercentage / 100) * parentHeight;
                        panel.style.height = `${newHeightPx}px`; // Apply new height

                    }
                }
                if (event.key === "Escape" && settingsModal.style.display != 'none') {
                    close();
                }
            });
            closeModal.addEventListener("click", close);
            exitModal.addEventListener("click", close);

        });

        container.title = "Settings";
        return container;
    },
});
var SettingsButton = new L.Control.SettingsButton()

L.Control.CustomSearch = L.Control.extend({
    onAdd: function (map) {
        let container = L.DomUtil.create("div", "leaflet-bar leaflet-control leaflet-control-custom");

        // Create the search button
        let searchButton = L.DomUtil.create("a", "leaflet-draw-draw-custom fa fa-font", container);
        searchButton.href = "#";

        // Create the search panel (hidden initially)
        let searchPanel = L.DomUtil.create("div", "leaflet-custom-search-panel", container);
        searchPanel.style.display = "none";

        // Create the text search input
        let textLabel = L.DomUtil.create("label", "", searchPanel);
        textLabel.innerText = "Text Search:";
        let textInput = L.DomUtil.create("input", "leaflet-draw-search-input", searchPanel);
        textInput.type = "text";
        textInput.placeholder = "Enter text...";

        // Create the asset name dropdown
        let assetLabel = L.DomUtil.create("label", "", searchPanel);
        assetLabel.innerText = "Asset Name:";
        let assetSelect = L.DomUtil.create("select", "leaflet-draw-search-select", searchPanel);
        let defaultOption = L.DomUtil.create("option", "", assetSelect);
        defaultOption.value = "Select Asset"
        defaultOption.innerText = "Select Asset"
        var layers = editableLayersGroup.getLayers();
        layers.forEach(layer => {
            layer.eachLayer(sublayer => {
                const data = sublayer.data;
                let option = L.DomUtil.create("option", "", assetSelect);
                option.value = data.Asset_Name
                option.innerText = data.Asset_Name
            })
        });

        //Create State Search Dropdown
        let stateLabel = L.DomUtil.create("label", "", searchPanel);
        stateLabel.innerText = "State Name:";
        let stateSelect = L.DomUtil.create("select", "leaflet-draw-search-select", searchPanel);
        let defaultStateOption = L.DomUtil.create("option", "", stateSelect);
        defaultStateOption.value = "Select State"
        defaultStateOption.innerText = "Select State"
        let statesLayers = statesLayer.getLayers();
        statesLayers.forEach(layers => {
            layers.eachLayer(layer => {
                let option = L.DomUtil.create("option", "", stateSelect);
                option.value = layer.feature.properties.name
                option.innerText = layer.feature.properties.name
            })
        })

        // Create the search button
        let searchActionButton = L.DomUtil.create("button", "leaflet-custom-search-button", searchPanel);
        searchActionButton.innerText = "Search";

        let searchResetButton = L.DomUtil.create("button", "leaflet-custom-search-reset-button", searchPanel);
        searchResetButton.innerText = "Reset";

        // Show search panel when clicking search icon
        L.DomEvent.on(searchButton, "click", function (e) {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);

            if (searchPanel.style.display === "none") {
                searchPanel.style.display = "block";
                textInput.focus();
            } else {
                searchPanel.style.display = "none";
            }
        });

        // Prevent map interactions when clicking inside search panel
        [searchPanel, textInput, assetSelect, searchActionButton].forEach(el => {
            L.DomEvent.on(el, "mousedown", L.DomEvent.stopPropagation)
                .on(el, "touchstart", L.DomEvent.stopPropagation);
        });

        // Handle search button click
        L.DomEvent.on(searchActionButton, "click", function () {
            let textValue = textInput.value;
            let assetValue = assetSelect.value;
            let stateValue = stateSelect.value;
            if (textValue == "" && assetValue == "Select Asset" && stateValue == "Select State") {
                return
            }
            var layers = editableLayersGroup.getLayers();
            var selectedStateFeature = null;
            var statePolygonCoords = [];
            var stateLayers = statesLayer.getLayers();
            stateLayers.forEach(layers => {
                let Layers = layers.getLayers();
                Layers.forEach(layer => {
                    if (layer.feature.properties.name.toLowerCase() === stateValue.toLowerCase()) {
                        selectedStateFeature = layer;
                        let geometry = layer.feature.geometry;
                        if (geometry.type === "Polygon") {
                            statePolygonCoords.push(geometry.coordinates[0]); // Single polygon case
                        } else if (geometry.type === "MultiPolygon") {
                            geometry.coordinates.forEach(poly => statePolygonCoords.push(poly[0])); // Multiple polygons
                        }
                    }
                });
            });
            let selectedMarkers = []
            layers.forEach(layer => {
                layer.eachLayer(sublayer => {
                    if (!sublayer.data) {
                        return
                    }
                    const data = sublayer.data;
                    let markerLatLng = sublayer.getLatLng();
                    if (
                        (textValue !== "" &&
                            !data.Asset_ID.toLowerCase().includes(textValue.toLowerCase()) &&
                            !data.Asset_Name.toLowerCase().includes(textValue.toLowerCase()) &&
                            !data.Details.toLowerCase().includes(textValue.toLowerCase()))
                        ||
                        (assetValue !== "Select Asset" &&
                            !data.Asset_Name.toLowerCase().includes(assetValue.toLowerCase()))
                        ||
                        (stateValue !== "Select State" &&
                            !isPointInMultiPolygon(markerLatLng, statePolygonCoords) &&
                            !isPointInPolygon(markerLatLng, statePolygonCoords)
                        )
                    ) {
                        map.removeLayer(sublayer);
                        return
                    }
                    selectedMarkers.push(sublayer)
                });
            });
            document.querySelector("tbody").innerHTML = "";
            DisplayAssetsInTable(selectedMarkers);
        });

        L.DomEvent.on(searchResetButton, "click", function () {
            var layers = editableLayersGroup.getLayers();
            layers.forEach(layer => {
                layer.eachLayer(sublayer => {
                    map.addLayer(sublayer)
                })
            });
            textInput.value = "";
            assetSelect.value = "Select Asset";
            stateSelect.value = "Select State";
            document.querySelector("tbody").innerHTML = "";
        })

        container.title = "Custom Search"
        return container;
    },

    onRemove: function (map) {
        // Cleanup if needed
    }
});
let SearchControl = new L.Control.CustomSearch({ position: "topleft" });

// Function to check if a point is inside a polygon using the Ray-Casting Algorithm
function isPointInPolygon(point, polygon) {
    let [x, y] = [point.lng, point.lat]; // Convert to long, lat for consistency
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let [xi, yi] = polygon[i];
        let [xj, yj] = polygon[j];

        let intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}

// Function to check if a point is inside any of the state's polygons (Multi-Polygon Support)
function isPointInMultiPolygon(point, polygons) {
    for (let i = 0; i < polygons.length; i++) {
        if (isPointInPolygon(point, polygons[i])) {
            return true; // Point is inside at least one polygon
        }
    }
    return false;
}








export {
    SearchButton,
    SearchControl,
    HelpButton,
    SettingsButton
}