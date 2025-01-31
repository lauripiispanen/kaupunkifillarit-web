var map = null
var markers = []
var locationMarker = null
var headingMarker = null
var mapPannedThisSession = false

var locationBaseColor = '#40b3ff'

var headingIconBaseOptions = {
  path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
  scale: 4,
  fillOpacity: 1,
  fillColor: locationBaseColor,
  anchor: new google.maps.Point(0, 4),
  strokeOpacity: 0
}

var locationIconBaseOptions = {
  path: google.maps.SymbolPath.CIRCLE,
  scale: 10,
  fillOpacity: 1,
  fillColor: locationBaseColor,
  strokeOpacity: 0
}

var defaultMapSettings = {
  lat: 60.1729721445,
  lng: 24.9399946767,
  zoom: 15
}

function getUserGPSLocation() {
  var geolocationOptions = {
    enableHighAccuracy: true,
    timeout: 30 * 1000,
    maximumAge: 60,
    frequency: 1000
  }

  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(geolocationSuccess, function(){}, geolocationOptions)
  }
}

function toggleMarkerVisibility() {
  var bounds = map.getBounds()
  markers.forEach(function(marker) {
    marker.setVisible(bounds.contains(marker.getPosition()))
  })
}

function initializeGoogleMaps() {
  var styles = [{"featureType": "all", "elementType": "labels.text.fill", "stylers": [{"saturation": 36 }, {"color": "#333333"}, {"lightness": 40 } ] }, {"featureType": "all", "elementType": "labels.text.stroke", "stylers": [{"visibility": "on"}, {"color": "#ffffff"}, {"lightness": 16 } ] }, {"featureType": "all", "elementType": "labels.icon", "stylers": [{"visibility": "off"} ] }, {"featureType": "administrative", "elementType": "geometry.fill", "stylers": [{"color": "#fefefe"}, {"lightness": 20 } ] }, {"featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{"color": "#fefefe"}, {"lightness": 17 }, {"weight": 1.2 } ] }, {"featureType": "landscape", "elementType": "geometry", "stylers": [{"color": "#f5f5f5"}, {"lightness": 20 } ] }, {"featureType": "poi", "elementType": "geometry", "stylers": [{"color": "#f5f5f5"}, {"lightness": 21 } ] }, {"featureType": "poi.park", "elementType": "geometry", "stylers": [{"color": "#e6e6e6"}, {"lightness": 21 } ] }, {"featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{"color": "#ffffff"}, {"lightness": 17 } ] }, {"featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{"color": "#ffffff"}, {"lightness": 29 }, {"weight": 0.2 } ] }, {"featureType": "road.arterial", "elementType": "geometry", "stylers": [{"color": "#ffffff"}, {"lightness": 18 } ] }, {"featureType": "road.local", "elementType": "geometry", "stylers": [{"color": "#ffffff"}, {"lightness": 16 } ] }, {"featureType": "transit", "elementType": "geometry", "stylers": [{"color": "#f2f2f2"}, {"lightness": 19 } ] }, {"featureType": "water", "elementType": "geometry", "stylers": [{"color": "#e0eff8"}, {"lightness": 17 } ] } ]

  var mapOptions = {
    center: new google.maps.LatLng(defaultMapSettings.lat, defaultMapSettings.lng),
    zoom: defaultMapSettings.zoom,
    disableDefaultUI: true,
    zoomControl: false,
    styles: styles
  }

  var mapElement = document.getElementById('map-canvas')
  map = new google.maps.Map(mapElement, mapOptions)

  map.addListener('center_changed', function() {
    mapPannedThisSession = true
  })
  map.addListener('bounds_changed', toggleMarkerVisibility)

  getUserGPSLocation()
}

function createStation(stationObject) {
  var bikesAvailable = parseInt(stationObject.bikesAvailable)
  var labelContent = '<div class="count">' + bikesAvailable + '</div>'
  var labelColor = bikesAvailable >= 2 ? '#FCBC19' : '#b9b9b9'

  var stationMarker = new MarkerWithLabel({
    position: new google.maps.LatLng(stationObject.lat, stationObject.lon),
    map: map,
    icon: {
      path: 'M1.0658141e-14,-54 C-11.0283582,-54 -20,-44.5228029 -20,-32.873781 C-20,-19.2421314 -1.49104478,-1.30230657 -0.703731343,-0.612525547 L-0.00447761194,-7.10542736e-15 L0.697761194,-0.608583942 C1.48656716,-1.29048175 20,-19.0458394 20,-32.873781 C20,-44.5228029 11.0276119,-54 1.0658141e-14,-54 L1.0658141e-14,-54 Z',
      fillColor: labelColor,
      fillOpacity: 1,
      scale: 0.8,
      strokeWeight: 0
    },
    labelAnchor: new google.maps.Point(20, 33),
    labelContent: labelContent
  })

  markers.push(stationMarker)
}

function setupHeadingMarker(userLatLng) {
  function getCompassHeading() {
    if (event.webkitCompassHeading) {
      return event.webkitCompassHeading
    } else {
      return event.alpha
    }
  }
  function updateHeadingMarker() {
    var iconOptions = headingIconBaseOptions
    iconOptions.rotation = getCompassHeading()

    headingMarker.setOptions({
      position: userLatLng,
      icon: iconOptions
    })
  }
  function drawHeadingMarker() {
    headingMarker = new google.maps.Marker({
      position: userLatLng,
      icon: headingIconBaseOptions,
      map: map
    })
  }
  function rotateHeadingIcon(eventData) {
    if (headingMarker) {
      updateHeadingMarker()
    } else if (event.webkitCompassHeading || event.alpha) {
      drawHeadingMarker()
    }
  }

  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', rotateHeadingIcon)
  }
}

function createOrUpdateLocationMarker(userLatLng) {
  if (locationMarker) {
    locationMarker.setOptions({
      position: userLatLng,
      icon: locationIconBaseOptions
    })
  } else {
    locationMarker = new google.maps.Marker({
      position: userLatLng,
      icon: locationIconBaseOptions,
      map: map
    })
  }
}


function geolocationSuccess(position) {
  var userLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude)

  createOrUpdateLocationMarker(userLatLng)
  setupHeadingMarker(userLatLng)

  if (!mapPannedThisSession) {
    map.panTo(userLatLng)
    mapPannedThisSession = true
  }
}

function getJSON(url, callback) {
  var request = new XMLHttpRequest()
  request.open('GET', url, true)

  request.onload = function() {
    if (this.status >= 200 && this.status < 400) {
      var data = JSON.parse(this.response)
      callback(data)
    }
  }

  request.send()
}

function toggleSidebar() {
  document.querySelectorAll('.sidebar')[0].classList.toggle('visible')
}

function initializeApp() {
  document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar)
  document.getElementById('sidebar-close').addEventListener('click', toggleSidebar)

  initializeGoogleMaps()

  getJSON('/api/stations', function(data) {
    data.bikeRentalStations.map(createStation)
  })
}

function ready(fn) {
  if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
    fn()
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(initializeApp)
