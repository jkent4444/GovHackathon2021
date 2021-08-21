let map, 
infoWindow, 
homeMarker,
currPos,
homeCircle,
currentPostcode,
closePostcodes;

var markers = {
    "locationMarkers": [],
    "businessMarkers": [],
}


function getlatLngOffsets(pos, distance){
    //Position, decimal degrees
    lat = pos.lat
    lng = pos.lng

    //Earth’s radius, sphere
    R=6378137

    //offsets in meters
    dn = distance
    de = distance

    //Coordinate offsets in radians
    dLat = dn/R

    dLon = de/(R*Math.cos(Math.PI*lat/180))

    //OffsetPosition, decimal degrees
    latO = lat + dLat * 180/Math.PI
    lonO = lng + dLon * 180/Math.PI

    latNegO = lat - dLat * 180/Math.PI
    lonNegO = lng - dLon * 180/Math.PI

    posOffset = {
      lat: latO,
      lng: lonO,
    }

    negPosOffset = {
      lat: latNegO,
      lng: lonNegO,
    }

    LatLngBounds = {
      negPosOffset: negPosOffset, 
      posOffset: posOffset
    }
    
    return LatLngBounds
}

//This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
function calcCrow(lat1, lon1, lat2, lon2) {
  var R = 6378137; // km
  var dLat = toRad(lat2-lat1);
  var dLon = toRad(lon2-lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c;
  return d;
}

// Converts numeric degrees to radians
function toRad(Value) 
{
    return Value * Math.PI / 180;
}

function getAllPostCodesWithInBounds(LatLngBounds) {
  var dataWithinBounds = [];
  for(var i = 0; i < postcodeLatLng.length; i++){
    lat = postcodeLatLng[i].lat;
    lng = postcodeLatLng[i].lon;
    if(lat >= LatLngBounds.negPosOffset.lat && 
      lng >= LatLngBounds.negPosOffset.lng && 
      lat <= LatLngBounds.posOffset.lat && 
      lng <= LatLngBounds.posOffset.lng
      ) {
        dataWithinBounds.push(postcodeLatLng[i])
    } 
  }
  return dataWithinBounds;
}

function getAllPostCodesWithinRadius(dataWithinBounds, radius){
  lat1 = currPos.lat;
  lon1 = currPos.lng;

  dataWithinRadius = [];
  for(index in dataWithinBounds){
    locationData = dataWithinBounds[index];
    lat2=locationData.lat;
    lon2=locationData.lon;
    distance = calcCrow(lat1, lon1, lat2, lon2);
    if(distance <= radius ){
      dataWithinRadius.push(dataWithinBounds[index])
    }
  }
  return dataWithinRadius;
}

function getAllClosePostCodes(radius){
  var LatLngBounds = getlatLngOffsets(currPos, radius);
  dataWithinBounds = getAllPostCodesWithInBounds(LatLngBounds);

  Postcodes = getAllPostCodesWithinRadius(dataWithinBounds, radius);

  for(postcode in Postcodes){
    locationData = Postcodes[postcode]
    var markers = new google.maps.Marker({
      position: {
        lat:locationData.lat,
        lng:locationData.lon},
      map,
      title: "Current Location",
    });
  }
 
}

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 16,
    scaleControl: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });
  infoWindow = new google.maps.InfoWindow();
  askForGeoLocation();

  addSliderControl();

  addHomeMoveOnRightClick();

  addLeftClickTracking();
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

    getlatLngOffsets(pos, 1000);
    homeMarker = new google.maps.Marker({
        position: pos,
        map,
        title: "Current Location",
    });
    map.setCenter(pos);
}

function moveHomeMarketToCurrPos(){
  homeMarker.setPosition(currPos);
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
            currPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            var currPosItem = sessionStorage.getItem("currPos")
            if(currPosItem == null){
              placeHomeMarkerOnPos(currPos);
            } else {
              pos = JSON.parse(currPosItem);
              currPos = pos
              console.log(currPos);
              placeHomeMarkerOnPos(pos);
            }
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

function updateCurrPos(){
  updateCircle();
  moveHomeMarketToCurrPos();
  map.panTo(currPos);
}

/** CIRCLE RANGE */
function updateCircle(){
  var key = parseInt(jQuery("#slider-range").val());
  var distance = parseInt(jQuery(".slider-range-container span:eq("+key+")").attr("value"));
  homeCircle.setMap(null);
  homeCircle = new google.maps.Circle({
    strokeColor: "black",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "green",
    fillOpacity: 0.1,
    map,
    center: currPos,
    radius: distance,
    clickable:false
  });
  homeCircle.setMap(map);

  switch (key){
    case 5:
      map.setZoom(12);
      break;
    case 4:
      map.setZoom(13);
      break;
    case 3:
      map.setZoom(16);
      break;
    case 2:
      map.setZoom(17);
      break;
    case 1:
      map.setZoom(18);
      break;
    default:
      map.setZoom(18);
  }
    

}

function addSliderControl(){
  setTimeout(function(){
      homeCircle = new google.maps.Circle({
        strokeColor: "#black",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "green",
        fillOpacity: 0.1,
        map,
        center: currPos,
        radius: 1000,
        clickable:false
      });
      homeCircle.setMap(map);
  },500);
  jQuery("#slider-range").change(function(){
      updateCircle();
  })
}

function addHomeMoveOnRightClick(){
  google.maps.event.addListener(map, "rightclick", function(event) {
      var lat = event.latLng.lat();
      var lng = event.latLng.lng();
      // populate yor box/field with lat, lng
      currPos = {
        lat: lat,
        lng: lng
      };
      sessionStorage.setItem("currPos", JSON.stringify(currPos));
      updateCurrPos();
  });
}

function addRatingButtonToPlace(placeId){
  setTimeout(function(){
    jQuery(".covid-rating-button").remove();
    var title = jQuery(".title").text().trim();
    var address = jQuery(".address > div:eq(0)").text() + " " + jQuery(".address > div:eq(1)").text() + " " + jQuery(".address > div:eq(2)").text();
    var link = "https://covidsafedata.com.au/?address="+address+"&placeId="+placeId+"&title="+title;
    jQuery(".address").append('<a class="covid-rating-button" href="'+link+'">Add Covid Safe Rating</a>');
  }, 1);
}

function placeRating(placeId){
  addRatingButtonToPlace(placeId);
}

function addLeftClickTracking(){
  google.maps.event.addListener(map, "click", function(event) {
    if(event.placeId !== undefined){
      placeRating(event.placeId)
      
    }
  });
}


