// python -m SimpleHTTPServer
let year = -1200;
let data = new Map();
let map;
setYear(year);
let jsonLoaded = false;
let mapLoaded = false;
const yearInterval = 40;
let itemsProcessed = 0;
let totalNumberOfItems;
let interval;
let bounds = null;
var Popup;


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
  new Popup(item, googleLatLng);
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
  Popup = createPopupClass();
  map.addListener('tilesloaded', function() {
    if (mapLoaded) {
      return;
    }
    mapLoaded = true;
    maybeStartRunning();
  });
}

/**
 * Returns the Popup class.
 *
 * Unfortunately, the Popup class can only be defined after
 * google.maps.OverlayView is defined, when the Maps API is loaded.
 * This function should be called by initMap.
 */
function createPopupClass() {
  /**
   * A customized popup on the map.
   * @param {!google.maps.LatLng} position
   * @param {!Element} content The bubble div.
   * @constructor
   * @extends {google.maps.OverlayView}
   */
  function Popup(item, googleLatLng) {
    this.position = googleLatLng;
      
    const content = document.createElement('div');
    content.innerText = item['title'];
    content.classList.add('popup-bubble');

    // This zero-height div is positioned at the bottom of the bubble.
    var bubbleAnchor = document.createElement('div');
    bubbleAnchor.classList.add('popup-bubble-anchor');
    bubbleAnchor.appendChild(content);

    // This zero-height div is positioned at the bottom of the tip.
    this.containerDiv = document.createElement('div');
    this.containerDiv.classList.add('popup-container');
    this.containerDiv.appendChild(bubbleAnchor);
    const img = document.createElement('img');
    img.classList.add('book');
    img.src = 'book.png';
    containerDiv.appendChild(img);

    // Optionally stop clicks, etc., from bubbling up to the map.
    google.maps.OverlayView.preventMapHitsAndGesturesFrom(this.containerDiv);
    const containerDiv = this.containerDiv;
    setTimeout(function() {
      const year = item['year'];
      const yearToDisplay = year >= 0 ? year : (-1 * year) + 'BCE';
      var infowindow = new google.maps.InfoWindow({
        position: googleLatLng,
        content: [item['title'], item['place'], yearToDisplay].join(', ')
      });
      img.addEventListener('click', function() {
        infowindow.open(map);
      });
      img.addEventListener('mouseover', function() {
        infowindow.open(map);
      });
      img.addEventListener('mouseout', function() {
        infowindow.close();
      });
    }, yearInterval * 50);
    
    this.setMap(map);

  }
  // ES5 magic to extend google.maps.OverlayView.
  Popup.prototype = Object.create(google.maps.OverlayView.prototype);

  /** Called when the popup is added to the map. */
  Popup.prototype.onAdd = function() {
    this.getPanes().floatPane.appendChild(this.containerDiv);
  };
    
    

  /** Called when the popup is removed from the map. */
  Popup.prototype.onRemove = function() {
    if (this.containerDiv.parentElement) {
      this.containerDiv.parentElement.removeChild(this.containerDiv);
    }
  };

  /** Called each frame when the popup needs to draw itself. */
  Popup.prototype.draw = function() {
    var divPosition = this.getProjection().fromLatLngToDivPixel(this.position);

    // Hide the popup when it is far out of view.
    var display =
      Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000
        ? 'block'
        : 'none';

    if (display === 'block') {
      this.containerDiv.style.left = divPosition.x + 'px';
      this.containerDiv.style.top = divPosition.y + 'px';
    }
    if (this.containerDiv.style.display !== display) {
      this.containerDiv.style.display = display;
    }
  };

  return Popup;
}
