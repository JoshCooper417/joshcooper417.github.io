// python -m SimpleHTTPServer
const firstYear = -1200;
let data = new Map();
const yearToBounds = new Map();
let map;
let jsonLoaded = false;
let mapLoaded = false;
let totalNumberOfItems;
let boundsBuilder = null;
const latLngRandomFactor = .1;
let pause = false;
let lastYear = firstYear;
const mapElement = document.getElementById('map');
const pauseElement = document.getElementById('pause');
const timelineElement = document.getElementById('timelineRange');
const yearElement = document.getElementById('year');

$.getJSON('data.json', function(json) {
  totalNumberOfItems = json.length;
  const addItem = function(item) {
    const itemYear = item.year;
    if (!data.has(itemYear)) {
      data.set(itemYear, []);
    }
    data.get(itemYear).push(createMarker(item));
    lastYear = Math.max(lastYear, itemYear);
  };
  json.forEach(addItem);
  timelineElement.max = lastYear;
  jsonLoaded = true;
  maybeStartRunning();
});

async function maybeStartRunning() {
  if (!(jsonLoaded && mapLoaded)) {
    return;
  }
  incrementYear();
}

function togglePause(forcePause) {
  pause = forcePause || !pause;
  pauseElement.innerText = pause ? 'Unpause' : 'Pause';
  if (!pause) {
    incrementYear();
  }
}

async function incrementYear() {
  if (pause) {
    return;
  }
  showYearData(++timelineElement.valueAsNumber, true, true);
  const year = timelineElement.valueAsNumber;
  showYearText(year);
  if (year < timelineElement.max * 1) {
    window.setTimeout(incrementYear, getInterval(year));
  }
};

async function showYearData(year, shouldShow, shouldAnimate) {
  if (!data.has(year)) {
    return;
  }
  if (yearToBounds.has(year) && shouldShow) {
    map.fitBounds(yearToBounds.get(year));
  }
  const dataForYear = data.get(year);
  for (var i = 0; i < dataForYear.length; i++) {
    dataForYear[i].setAnimation(shouldAnimate ? google.maps.Animation.DROP : null);
    dataForYear[i].setMap(shouldShow ? map : null);
    if (shouldShow && shouldAnimate) {
      await timeout(3);
    }
  }
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomize(latOrLng) {
  return latOrLng + (latLngRandomFactor - (Math.random() * latLngRandomFactor * 2));
}

function addRandomFactor(latLng) {
  return {lat: randomize(latLng.lat), lng: randomize(latLng.lng)};
}

function createMarker(item) {
  const place = addRandomFactor(item['lat_lng']);
  const year = item['year'];
  const googleLatLng =  new google.maps.LatLng(place.lat, place.lng);
  boundsBuilder = boundsBuilder || new google.maps.LatLngBounds();
  boundsBuilder.extend(googleLatLng);
  if (year > -850) {
    const newBounds = new google.maps.LatLngBounds();
    yearToBounds.set(year, newBounds.union(boundsBuilder));
  }

  const marker = new google.maps.Marker({
    position: place,
  });
  const yearToDisplay = year >= 0 ? year : (-1 * year) + 'BCE';
  const infowindow = new google.maps.InfoWindow({
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
  return marker;
}

timelineElement.onchange = function() {
  togglePause(true);
  const year = timelineElement.valueAsNumber;
  showYearText(year);
  data.forEach((_, yearKey) => showYearData(yearKey, yearKey <= year, false));
  showYearText(year);
}

function showYearText(year) {
  yearElement.innerText = year;
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
  map = new google.maps.Map(mapElement, mapOptions);
  map.addListener('tilesloaded', function() {
    if (mapLoaded) {
      return;
    }
    mapLoaded = true;
    maybeStartRunning();
  });
}
