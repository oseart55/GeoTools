(function(){"use strict";self.onmessage=function(t){let e=t.data,r=[];for(let s=0;s<e;s++){let o=n(34.307144,44.056012),l=n(-122.124023,-70.510742);r.push({lat:o,lng:l,data:{Asset_ID:a(10),Asset_Name:a(10),Location:`${o}, ${l}`,Details:a(10)}})}self.postMessage(r)};function n(t,e){return Math.random()*(e-t)+t}function a(t){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";return Array.from({length:t},()=>e.charAt(Math.floor(Math.random()*e.length))).join("")}})();
