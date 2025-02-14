import { map, editableLayers} from "../main";
import { GetAssets } from "./tableUtil";

function AddMapDrawEvent(){
    map.addEventListener(L.Draw.Event.CREATED, function (e) {
        var type = e.layerType,
            layer = e.layer;
        layer.bindContextMenu({
            contextmenu: true,
            contextmenuItems: [{
                text: 'Remove Polygon',
                index: 1,
                callback: function () {
                    editableLayers.removeLayer(layer);
                }
            }
                , {
                separator: true,
                index: 2
            }]
        });
        editableLayers.addLayer(layer);
    });
    map.on('draw:drawstart', function (e) {
        map.off('click', finishPolygon); 
        map.on('click', finishPolygon);
    });
}

function AddEditableLayersEvent(){
    editableLayers.addEventListener("layeradd", function (e) {
        if (e.layer instanceof L.Rectangle) {
            GetAssets('rectangle', e.layer);
        } 
        if (e.layer instanceof L.Circle) {
            GetAssets('circle', e.layer);
        }
        if (e.layer instanceof L.Polygon) {
            GetAssets('polygon', e.layer);
        }
    });
    
    editableLayers.addEventListener("layerremove", function (e) {
        // Clear table rows efficiently using native JS
        const table = document.getElementById("myTable");
        const tbody = table.querySelector("tbody");
        tbody.innerHTML = ""
        editableLayers.eachLayer(function (layer) {
            e.layer instanceof L.Rectangle ? GetAssets('rectangle', layer) : GetAssets('circle', layer)
        });
    });
}

function finishPolygon(e) {
    let latlng = e.latlng;
    let layers = editableLayers.getLayers();
    if (layers.length > 0) {
        let firstLayer = layers[0]; // Get the first drawn polygon
        let latlngs = firstLayer.getLatLngs()[0];

        if (latlngs.length > 2) {
            let firstPoint = latlngs[0];
            let distance = map.distance(firstPoint, latlng);

            if (distance < 10) { // Tolerance for closure
                firstLayer.addLatLng(firstPoint); // Close the polygon
                map.off('click', finishPolygon); // Remove event listener
            }
        }
    }
}

export {
    AddMapDrawEvent,
    AddEditableLayersEvent
}