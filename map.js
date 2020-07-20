// python -m SimpleHTTPServer
let year = -1200;
let data = new Map();
let map;
setYear(year);
let jsonLoaded = false;
let mapLoaded = false;
const yearInterval = 20;
let itemsProcessed = 0;
let totalNumberOfItems;
let interval;
let bounds = null;


$.getJSON("data.json", function(json) {
  totalNumberOfItems = json.length;
  const addItem = function(item) {
    if (!data.has(item.year)) {
      data.set(item.year, []);
    }
    data.get(item.year).push(item);
  };
  json.forEach(addItem);
  jsonLoaded = true;
  maybeStartRunning();
});

function maybeStartRunning() {
  if (!(jsonLoaded && mapLoaded)) {
    return;
  }
  interval = window.setInterval(incrementYear, yearInterval);
  incrementYear();
}

function incrementYear() {
  if (itemsProcessed >= totalNumberOfItems) {
    clearInterval(interval);
  }
  setYear(++year);
  if (!data.has(year)) {
    return;
  }
  data.get(year).forEach(showData);
};

function randomize(latOrLng) {
  return latOrLng + (.02 - (Math.random() * .04));
}

function addRandomFactor(latLng) {
  return {lat: randomize(latLng.lat), lng: randomize(latLng.lng)};
}

function showData(item) {
  itemsProcessed++;
  const place = addRandomFactor(item['lat_lng']);
  const googleLatLng =  new google.maps.LatLng(place.lat, place.lng);
  bounds = bounds || new google.maps.LatLngBounds();
  bounds.extend(googleLatLng);
  map.fitBounds(bounds);

  const image = {
    url: 'book.png',
    scaledSize: new google.maps.Size(10, 10)
  };
  var marker = new google.maps.Marker({
    icon: image,
    position: place,
    map: map,
    animation: google.maps.Animation.DROP,
  });
  const year = item['year'];
  const yearToDisplay = year >= 0 ? year : (-1 * year) + 'BCE';
  var infowindow = new google.maps.InfoWindow({
    content: [item['title'], item['place'], yearToDisplay].join(', ')
  });

  marker.addListener('click', function() {
    infowindow.open(map, marker);
  });

  marker.addListener('mouseover', function() {
    infowindow.open(map, this);
  });

  marker.addListener('mouseout', function() {
    infowindow.close();
  });
}

function setYear(year) {
  document.getElementById('year').innerText = year;
}

// Initialize and add the map
function initMap() {
  var mapOptions = {
    zoom: 7,
    // Weird hard-coding, can do better.
    center: {lat: 30.51961046277556, lng: 34.75605005407532}
  };
  map = new google.maps.Map(document.getElementById('map'), mapOptions);
  map.addListener('tilesloaded', function() {
    if (mapLoaded) {
      return;
    }
    mapLoaded = true;
    maybeStartRunning();
  });
}
