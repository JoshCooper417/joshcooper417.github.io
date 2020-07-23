// python -m SimpleHTTPServer
let year = -1200;
let data = new Map();
let map;
setYear(year);
let jsonLoaded = false;
let mapLoaded = false;
let itemsProcessed = 0;
let totalNumberOfItems;
let bounds = null;
const latLngRandomFactor = .1;
let pause = false;

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

async function maybeStartRunning() {
  if (!(jsonLoaded && mapLoaded)) {
    return;
  }
  incrementYear();
}

function togglePause() {
  pause = !pause;
  document.getElementById('pause').innerText = pause ? 'Unpause' : 'Pause';
  if (!pause) {
    incrementYear();
  }
}

async function incrementYear() {
  if (pause) {
    return;
  }
  if (itemsProcessed >= totalNumberOfItems) {
    return;
  }
  setYear(++year);
  window.setTimeout(incrementYear, getInterval(year));
  if (data.has(year)) {
    var dataForYear = data.get(year);
    for (var i = 0; i < dataForYear.length; i++) {
      showData(dataForYear[i]);
      await timeout(3);
    }
  }
};

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomize(latOrLng) {
  return latOrLng + (latLngRandomFactor - (Math.random() * latLngRandomFactor * 2));
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

  var marker = new google.maps.Marker({
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

function getInterval(year) {
  // TODO: Make this logic smarter.
  return year < 850 ? 20 : 60;
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
