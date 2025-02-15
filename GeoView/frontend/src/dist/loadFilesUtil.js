// Function to display the GeoJSON data on the map
function displayGeoJSON(geojsonString) {
    const geojsonData = JSON.parse(geojsonString);

    // Remove existing layers if needed
    if (window.geojsonLayer) {
        window.map.removeLayer(window.geojsonLayer);
    }

    // Add new GeoJSON layer
    window.geojsonLayer = L.geoJSON(geojsonData, {
        onEachFeature: onFeature
    })


    return window.geojsonLayer
}

function onFeature(feature, layer) {
    if (feature.properties) {
        let popupContent = "";
        for (let key in feature.properties) {
            let value = feature.properties[key];
            if (typeof value === "object") {
                value = JSON.stringify(value); // Convert objects to string
            }
            popupContent += `<b>${key}:</b> ${value}<br>`;
        }
        layer.bindPopup(popupContent);
    }
}

export {
    displayGeoJSON
}