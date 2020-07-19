// python -m SimpleHTTPServer
let year = -1000;
let data = new Map();
let data2 = new Map();
let map;
setYear(year);
let jsonLoaded = false;
let locationJsonLoaded = false;
let mapLoaded = false;
const yearInterval = 1;
let itemsProcessed = 0;
let totalNumberOfItems;
let interval;
let locationData;
let bounds = null;


$.getJSON("data.json", function(json) {
  totalNumberOfItems = json.length;
  const addItem = function(item) {
    if (!data.has(item.year)) {
      data.set(item.year, []);
    }
    data.get(item.year).push(item);
    
    if (!data2.has(item.place)) {
      data2.set(item.place, []);
    }
    data2.get(item.place).push(item);
  };
  json.forEach(addItem);
  jsonLoaded = true;
  maybeStartRunning();
});


$.getJSON("locations.json", function(json) {
  locationData = json;
  locationJsonLoaded = true;
  maybeStartRunning();
});

function maybeStartRunning() {
  if (!(jsonLoaded && mapLoaded && locationJsonLoaded)) {
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
  const place = addRandomFactor(locationData[item['place']] || {lat: 0, lng: 0});
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
  var infowindow = new google.maps.InfoWindow({
    content: [item['title'], item['place'], item['year']].join(', ')
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
    zoom: 1,
  };
  map = new google.maps.Map(document.getElementById('map'), mapOptions);
  mapLoaded = true;
  maybeStartRunning();
}
