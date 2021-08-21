let map, 
infoWindow, 
homeMarker,
currPos

var markers = {
    "locationMarkers": [],
    "businessMarkers": [],
}

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 8,
  });
  infoWindow = new google.maps.InfoWindow();
  askForGeoLocation();
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(
      browserHasGeolocation
        ? "Error: The Geolocation service failed."
        : "Error: Your browser doesn't support geolocation."
    );
    infoWindow.open(map);
}

function placeHomeMarkerOnPos(pos){
    homeMarker = new google.maps.Marker({
        position: pos,
        map,
        title: "Current Location",
    });
    map.setCenter(pos);
}

function placeNewMarker(id, markerType, markerInfo){

}

function addMoveToWhenClicked(marker){
    map.setZoom(15);
    map.setCenter(marker.getPosition());
}

function addBasicClickEventToAllMarkers(){
    homeMarker.addListener("click", () => {
        addMoveToWhenClicked(homeMarker);
    });

    for(markerTypes in markers){
        for(marker in markers[markerTypes]){
            marker.addListener("click", () => {
                addMoveToWhenClicked(marker);
            });
        }
    }
}

function askForGeoLocation(infoWindow){
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            placeHomeMarkerOnPos(pos);
            currPos = pos
          },
          () => {
            handleLocationError(true, infoWindow, map.getCenter());
          }
        );
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
}

