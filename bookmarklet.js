/* there is a 'data' variable defined in the window, it is a list of lists.
one element looks like this: 

[3895, 3277, "47.863133", "20.146333", "M", "K", "M115:M", "Mátra 115",
"N", "M", "MK"]
[0] and [1] are ids of the cache. [2] and [3] are coordinates. [4] is the
type of the cache. [5] is the status (can be found?). [6] is the point id. 
[7] is the name of the cache. [8] is find status (N = not yet found by the
logged in user; everything is N if not logged in). [9] is the point type
(M = starting point of a multi-cache, T = additional point of a multi-cache),
[10] is a one-field summary of [8] and [9].
*/

var newData = data.filter(point => (
  // we only care if the logged-in user has not found the cache yet to
  // save resources.
  point[8] == "N"
  // and the point should be the starting or additional point of 
  // a multi-cache
  && (point[9] == "M" || point[9] == "T")
))
var sortedData = newData.sort(
  // we want to sort the caches based on ID and rank within the multi
  // unfortunately, the rank can only be extracted from the point id
  // field and it is a non-zero-padded number in a string. hence this.
  function (a, b) {
    return (
      (a[0] * 100 + Number(a[6].split(':')[1].substring(1))) -
      (b[0] * 100 + Number(b[6].split(':')[1].substring(1)))
    )
  }
);

// initialize an empty list for all the GeoJSON LineStrings we will create
var myLines = [];
// the coordinates that go in the "current" LineString as we iterate through
// the points
var currentCoordinates = [];
for (let i = 0; i < sortedData.length - 1; i++) {
  // add the current point to the list
  currentCoordinates.push([
    // coordinates are switched because GeoJSON uses x, y coordinates,
    // which is longitude and latitude in a geographical coordinate
    // system, while geographical coordinates are normally referred to
    // as lat-lon pairs (and this is the order in the data as well).
    sortedData[i][3], sortedData[i][2] 
  ])
  
  // if we have arrived at a point where the next one belongs to a cache
  // with a different ID, we should finish and append our line to myLines
  if (sortedData[i + 1][0] != sortedData[i][0]) {
    // but only if there is more than one point (some multi-caches have
    // only one published point, and one point is not a line)
    if (currentCoordinates.length > 1) {
      // we push a GeoJSON LineString object
      // https://datatracker.ietf.org/doc/html/rfc7946#appendix-A.2
      myLines.push({
        "type": "LineString",
        "coordinates": currentCoordinates
      })
    }

    currentCoordinates = []
  }
}

// the main page has Leaflet loaded and an object called "map" that
// holds the map. let's add our data as a layer to it.
var linesLayer = L.geoJSON().addTo(map);
linesLayer.addData(myLines);
