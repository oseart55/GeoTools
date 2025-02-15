import { AddEditableLayersEvent } from "./eventsUtil";

L.drawLocal.draw.toolbar.buttons.rectangle = 'Search By Polygon';
L.drawLocal.draw.toolbar.buttons.circle = 'Search By Circle';

var editableLayers = new L.FeatureGroup();

let drawControl = new L.Control.Draw({
    draw: {
        marker: false,
        polyline: false,
        rectangle: {
            metric: false
        },
        circle: {
            metric: false
        },
        circlemarker: false

    },
    edit: {
        featureGroup: editableLayers,
        edit: true,
        remove: false
    },
});
AddEditableLayersEvent()
export {
    drawControl,
    editableLayers
}