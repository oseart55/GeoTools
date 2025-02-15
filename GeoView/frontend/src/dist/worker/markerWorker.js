
self.onmessage = function (e) {
    let numMarkers = e.data;
    let markers = [];

    for (let i = 0; i < numMarkers; i++) {
        let lat = getRandomDecimal(34.307144, 44.056012);
        let lng = getRandomDecimal(-122.124023, -70.510742);

        markers.push({
            lat,
            lng,
            data: {
                Asset_ID: makeid(10),
                Asset_Name: makeid(10),
                Location: `${lat}, ${lng}`,
                Details: makeid(10)
            }
        });
    }

    // Send data back to the main thread
    self.postMessage(markers);
};

function getRandomDecimal(min, max) {
    return Math.random() * (max - min) + min;
}

function makeid(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
}
