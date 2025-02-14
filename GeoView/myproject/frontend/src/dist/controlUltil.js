import { map } from "../main";
import { drawControl } from "./drawUtil";

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
        // searchButton.innerHTML = "🔍"; // Search icon
        searchButton.href = "#";

        // Create the search input (hidden by default)
        let searchInput = L.DomUtil.create("input", "leaflet-draw-search-input", container);
        searchInput.type = "text";
        searchInput.placeholder = "Search...";
        searchInput.style.display = "none";

        // Prevent map drag when interacting with input
        L.DomEvent.on(searchInput, "mousedown", L.DomEvent.stopPropagation)
                  .on(searchInput, "touchstart", L.DomEvent.stopPropagation)
                  .on(searchInput, "click", L.DomEvent.stopPropagation)
                  .on(searchInput, "dblclick", L.DomEvent.stopPropagation)
                  .on(searchInput, "keypress", L.DomEvent.stopPropagation);

        // Show input field on button click
        L.DomEvent.on(searchButton, "click", function (e) {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
            
            if (searchInput.style.display === "none") {
                searchInput.style.display = "block";
                searchInput.focus();
            } else {
                searchInput.style.display = "none";
            }
        });

        // Handle search input event
        L.DomEvent.on(searchInput, "keypress", function (e) {
            if (e.key === "Enter") {
                alert("Searching for: " + searchInput.value); // Replace with search logic
                // searchInput.style.display = "none"; // Hide input after search
            }
        });
        container.title = "Text Search"
        return container;
    },

    onRemove: function (map) {
        // Cleanup if needed
    }
});
let SearchControl = new L.Control.CustomSearch({ position: "topleft" });

export{
    SearchButton,
    SearchControl,
    HelpButton,
    SettingsButton
}