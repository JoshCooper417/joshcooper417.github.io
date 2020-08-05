// python -m SimpleHTTPServer
const firstYear = -1200;
let year = firstYear;
let data = new Map();
let map;
let jsonLoaded = false;
let mapLoaded = false;
let itemsProcessed = 0;
let totalNumberOfItems;
let bounds = null;
const latLngRandomFactor = .1;
let pause = false;
let lastYear = year;
const markerElement = document.getElementById('marker');
const mapElement = document.getElementById('map');
const pauseElement = document.getElementById('pause');
const timelineElement = document.getElementById('timeline');
const yearElement = document.getElementById('year');

$.getJSON('data.json', function(json) {
  totalNumberOfItems = json.length;
  const addItem = function(item) {
    const itemYear = item.year;
    if (!data.has(itemYear)) {
      data.set(itemYear, []);
    }
    data.get(itemYear).push(item);
    lastYear = Math.max(lastYear, itemYear);
  };
  json.forEach(addItem);
  jsonLoaded = true;
  maybeStartRunning();
});

async function maybeStartRunning() {
  if (!(jsonLoaded && mapLoaded)) {
    return;
  }
  for (var i = Math.floor(firstYear / 100) + 1; i < Math.floor(lastYear / 100); i+=4) {
    addEvent(i * 100);
  }
  incrementYear();
}

function addEvent(year, optText) {
  const eventElement = document.createElement('div');
  eventElement.classList.add('event');
  positionOnTimeline(eventElement, year);
  timelineElement.appendChild(eventElement);
  const text = optText || year;
  const eventTextElement = document.createElement('div');
  eventTextElement.classList.add('event-text');
  eventTextElement.innerText = text;
  eventElement.appendChild(eventTextElement);
}

function togglePause() {
  pause = !pause;
  pauseElement.innerText = pause ? 'Unpause' : 'Pause';
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
  const year = item['year'];
  const googleLatLng =  new google.maps.LatLng(place.lat, place.lng);
  bounds = bounds || new google.maps.LatLngBounds();
  bounds.extend(googleLatLng);
  if (year > -850) {
    // TODO: Replace this hack.
    map.fitBounds(bounds);
  }

  var marker = new google.maps.Marker({
    position: place,
    map: map,
    animation: google.maps.Animation.DROP,
  });
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
  positionOnTimeline(markerElement, year);
  yearElement.innerText = year;
}

function positionOnTimeline(element, year) {
  const yearRange = lastYear - firstYear;
  const percentage = 100 * ((lastYear - year) / yearRange) + '%';
  element.style.right = percentage;
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
