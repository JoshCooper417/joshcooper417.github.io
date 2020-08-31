// python -m SimpleHTTPServer
let data = new Map();
const yearToBounds = new Map();
const yearToEvents = new Map();
const initialLatLng = {lat: 30.51961046277556, lng: 34.75605005407532};
let map;
let jsonLoaded = false;
let mapLoaded = false;
let totalNumberOfItems;
let boundsBuilder = null;
const latLngRandomFactor = .1;
const initialZoom = 7;
const firstYearToZoom = -850;
let pause = false;
const mapElement = document.getElementById('map');
const pauseElement = document.getElementById('pause');
const timelineElement = document.getElementById('timelineRange');
const yearElement = document.getElementById('year');
const firstYear = timelineElement.min * 1;
let lastYear = firstYear;
const shouldFade = false;
let makePopup;
let markerClusterer;

$.getJSON('data.json', function(json) {
 markerClusterer = new MarkerClusterer(map, [],
  {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
 totalNumberOfItems = json.length;
  const addItem = function(item) {
    if (!item['lat_lng'] || !item['year']) {
      return;
    }
    const itemYear = item.year;
    if (!data.has(itemYear)) {
      data.set(itemYear, []);
    }
    data.get(itemYear).push(createMarker(item));
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
  incrementYear();
}

function togglePause(forcePause) {
  pause = forcePause || !pause;
  pauseElement.innerText = pause ? 'Play' : 'Pause';
  if (!pause) {
    incrementYear();
  }
}


timelineElement.onchange = function() {
  togglePause(true);
  const year = timelineElement.valueAsNumber;
  showYearText(year);
  data.forEach((_, yearKey) => showYearData(yearKey, yearKey <= year, false));
  if (shouldFade) {
    data.forEach((dataForYear, yearKey) => updateOpacity(dataForYear, year - yearKey));    
  }
  showYearText(year);
  if (year <= firstYearToZoom) {
    map.setCenter(initialLatLng);
    map.setZoom(initialZoom);
  }
}

async function incrementYear() {
  if (pause) {
    return;
  }
  showYearData(++timelineElement.valueAsNumber, true, true);
  const year = timelineElement.valueAsNumber;
  showYearText(year);
  if (shouldFade) {
    data.forEach((dataForYear, yearKey) => updateOpacity(dataForYear, year - yearKey));
  }
  if (year < timelineElement.max * 1) {
    window.setTimeout(incrementYear, getInterval(year));
  }
};

async function showYearData(year, shouldShow, shouldAnimate) {
  if (yearToEvents.has(year) && shouldShow) {
    yearToEvents.get(year).forEach(popup => popup.showAndThenHide());
  }
  if (yearToBounds.has(year) && shouldShow && year < 2000) {
    map.fitBounds(yearToBounds.get(year));
  } else if (shouldShow && year >= 2000) {
    map.setCenter(initialLatLng);
    map.setZoom(2);
  }
  if (!data.has(year)) {
    return;
  }
  if(!data.has(year)) {
    return;
  }
  const dataForYear = data.get(year);
  for (var i = 0; i < dataForYear.length; i++) {
    const pin = dataForYear[i];
    pin.setAnimation(shouldAnimate ? google.maps.Animation.DROP : null);
    pin.setMap(shouldShow ? map : null);
    if (shouldShow && shouldAnimate) {
      await timeout(3);
    }
  }
  let clustererFunction = items => shouldShow ? markerClusterer.addMarkers(items) : markerClusterer.removeMarkers(items);
  if (year < 2015 && !pause) {
    await timeout(year < 1990 ? 5000 : 1000);
  }
  clustererFunction(data.get(year));
}

function updateOpacity(dataForYear, delta) {
    const opacity = delta < 100 ? 1 : delta > 280 ? 0.1 : (0.1 + ((~~((280 - delta) / 20)) / 10));
    dataForYear.forEach(pin => {
        if (opacity != pin.getOpacity()) {
            pin.setOpacity(opacity);
        }
    });
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
  if (year > firstYearToZoom) {
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

  if (item['event']) {
    if (!yearToEvents.has(year)) {
      yearToEvents.set(year, []);
    }
    yearToEvents.get(year).push(makePopup(item['event'], googleLatLng));
  }
  return marker;
}

function showYearText(year) {
  yearElement.innerText = year;
}

function getInterval(year) {
  // TODO: Make this logic smarter.
  return year < 850 ? 20 : year < 1900 ? 60 : year > 2000 ? 80 : 200;
}

// Initialize and add the map
function initMap() {
  var mapOptions = {
    zoom: initialZoom,
    // Weird hard-coding, can do better.
    center: initialLatLng
  };
  map = new google.maps.Map(mapElement, mapOptions);

  /**
   * A customized popup on the map.
   */
  class Popup extends google.maps.OverlayView {
    constructor(position, text, year) {
      super();
      this.position = position;
      const content = document.createElement('div');
      content.innerText = text;
      content.classList.add("popup-bubble");
      // This zero-height div is positioned at the bottom of the bubble.
      const bubbleAnchor = document.createElement("div");
      bubbleAnchor.classList.add("popup-bubble-anchor");
      bubbleAnchor.appendChild(content);
      // This zero-height div is positioned at the bottom of the tip.
      this.containerDiv = document.createElement("div");
      this.containerDiv.classList.add("popup-container");
      this.containerDiv.appendChild(bubbleAnchor);
      // Optionally stop clicks, etc., from bubbling up to the map.
      Popup.preventMapHitsAndGesturesFrom(this.containerDiv);
    }
    /** Called when the popup is added to the map. */
    onAdd() {
      this.getPanes().floatPane.appendChild(this.containerDiv);
    }
    /** Called when the popup is removed from the map. */
    onRemove() {
      if (this.containerDiv.parentElement) {
        this.containerDiv.parentElement.removeChild(this.containerDiv);
      }
    }
    /** Called each frame when the popup needs to draw itself. */
    draw() {
      const divPosition = this.getProjection().fromLatLngToDivPixel(
        this.position
      );
      // Hide the popup when it is far out of view.
      const display =
        Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000
          ? "block"
          : "none";

      if (display === "block") {
        this.containerDiv.style.left = divPosition.x + "px";
        this.containerDiv.style.top = divPosition.y + "px";
      }

      if (this.containerDiv.style.display !== display) {
        this.containerDiv.style.display = display;
      }
    }

    showAndThenHide() {
      this.setMap(map);
      const that  = this;
      const hide = function() {
        that.containerDiv.classList.add('hide-popup-container');
        // TODO: Clean this up.
        window.setTimeout(function() {that.setMap(null);}, 2500);
      };
     // window.setTimeout(hide, 500);
    }
  }
  
  makePopup = function(text, latLng) {
    return new Popup(latLng, text);
  }

  map.addListener('tilesloaded', function() {
    if (mapLoaded) {
      return;
    }
    mapLoaded = true;
    maybeStartRunning();
  });
}
