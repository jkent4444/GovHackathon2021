var map, 
infoWindow, 
homeMarker,
currPos,
homeCircle,
currentPostcode,
closePostcodes,
dataInBounds,
testDataWithinBounds,
caseDataWithinBounds,
total_new_cases,
total_active,
total_tests;

var markers = {
    "locationMarkers": [],
    "businessMarkers": [],
    "inforMarkers":[]
}


function getlatLngOffsets(pos, distance){
    //Position, decimal degrees
    var lat = pos.lat
    var  lng = pos.lng

    //Earth’s radius, sphere
    var R=6378137

    //offsets in meters
    var dn = distance
    var de = distance

    //Coordinate offsets in radians
    var dLat = dn/R

    var dLon = de/(R*Math.cos(Math.PI*lat/180))

    //OffsetPosition, decimal degrees
    var latO = lat + dLat * 180/Math.PI
    var lonO = lng + dLon * 180/Math.PI

    var latNegO = lat - dLat * 180/Math.PI
    var lonNegO = lng - dLon * 180/Math.PI

    var posOffset = {
      lat: latO,
      lng: lonO,
    }

    var negPosOffset = {
      lat: latNegO,
      lng: lonNegO,
    }

    var LatLngBounds = {
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

function getSecondsFortnightAGosDate(){
  return  new Date(Date.now() - 12096e5).getTime();
}

function getCasesDataWithinTimeFrame(time, casesData){
  var data = [];
  
  for(var i = 0; i < casesData.length; i++){
      caseData = casesData[i];
      var caseTime = new Date(caseData.data_date).getTime();
      if(caseTime >= time){
        data.push(caseData);
      }
  }
  return data;
}

function getUniquePostCodeInBounds(){
  var postcodes = [];
  for(data in dataInBounds){
    var postcode = dataInBounds[data].postcode;
    if(postcodes.indexOf(postcode) === -1) {
      postcodes.push(postcode);
    }
  }
  return postcodes
}

function getCasesDataWithinBounds(casesData){
  var data = [];
  if(dataInBounds.length !== 0){
    postcodes = getUniquePostCodeInBounds();
    for(var i = 0; i < casesData.length; i++){
      var postcode = casesData[i].postcode;
      if(postcodes.indexOf(postcode) !== -1) {
        data.push(casesData[i]);
      }
    }
  }
  
  return data;
}

function sumTotalNewCases(casesData){
  var total_new_cases = 0;
  for(var i = 0; i < casesData.length; i++){
    if(casesData[i].new !== null){
      total_new_cases += casesData[i].new;
      
    }
  }
  
  return total_new_cases;
}

function sumTotalActiveCases(casesData){
  var total_active = 0;
  for(var i = 0; i < casesData.length; i++){
    if(casesData[i].active !== null){
      total_active += casesData[i].active;
    }
  }

  return total_active;
}

function sumTotalTestsCases(testsData){
  var total_tests = 0;
  for(var i = 0; i < testsData.length; i++){
    if(testsData[i][3] !== null){
      total_tests += testsData[i][3];
    }
  }

  return total_tests;
}

function getTestsDataWithinBounds(testData){
  var data = [];
  if(dataInBounds.length !== 0){
    postcodes = getUniquePostCodeInBounds();
    for(var i = 0; i < testData.length; i++){
      var postcode = parseInt(testData[i][2]);
      if(postcodes.indexOf(postcode) !== -1) {
        data.push(testData[i]);
      }
    }
  }
  return data;
}

function getTestsDataWithinTimeFrame(time, testsData){
  var data = [];
  
  for(var i = 0; i < testsData.length; i++){
      testData = testsData[i];
      
      var testTime = new Date(testsData[i][1]).getTime();
      if(testTime >= time){
        data.push(testData);
      }
  }

  return data;
}

function updateInfoContainer(){
  jQuery("#total-new-cases").text(total_new_cases);
  jQuery("#total-active-cases").text(total_active);
  jQuery("#total-tests").text(total_tests);
}

function getLastTwoWeeksOfEntries(casesData, testData){
  var ftime = getSecondsFortnightAGosDate()
  var dataInTimeFrame = getCasesDataWithinTimeFrame(ftime, casesData);
  caseDataWithinBounds = getCasesDataWithinBounds(dataInTimeFrame);

  var testDataInTimeFrame = getTestsDataWithinTimeFrame(ftime, testData);
  testDataWithinBounds = getTestsDataWithinBounds(testDataInTimeFrame);


  total_new_cases = sumTotalNewCases(caseDataWithinBounds);
  total_active = sumTotalActiveCases(caseDataWithinBounds);
  total_tests = sumTotalTestsCases(testDataWithinBounds);

  updateInfoContainer();
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

function setDataWithinBounds(radius){
  var LatLngBounds = getlatLngOffsets(currPos, radius);
  dataWithinBounds = getAllPostCodesWithInBounds(LatLngBounds);
  dataInBounds = getAllPostCodesWithinRadius(dataWithinBounds, radius);
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
  var distance = parseInt(jQuery(".slider-range-container span[key='"+key+"']").attr("value"));
  
  setDataWithinBounds(distance)
  getLastTwoWeeksOfEntries(postCodesMonth, postCodeTests)
  

  if(homeCircle !== undefined){
    homeCircle.setMap(null);
  }
  
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
    
  map.setCenter(homeMarker.getPosition());
}

function addSliderControl(){
  setTimeout(function(){
    updateCircle();
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


