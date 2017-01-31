// var ViewModel = function() {

// }
// ko.applyBindings(new ViewModel());

// Google Maps API
var map;
var service;
var infowindow;
var locations = [];
var markers = [];

function initMap() {
    var ballard = new google.maps.LatLng(47.669525,-122.377396);

    map = new google.maps.Map(document.getElementById('map'), {
        center: ballard,
        zoom: 15
    });

    infowindow = new google.maps.InfoWindow();

    var request  = {
        location: ballard,
        radius: '800',
        keyword: 'coffee'
    };

    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, findLocations);
}

function findLocations(results, status){
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            var place = results[i];
            createMarker(results[i]);
            markers.push(results[i]);
        }
    }
}

function createMarker(loc) {
    var marker = new google.maps.Marker({
        map: map,
        position: loc.geometry.location,
        animation: google.maps.Animation.DROP
    });

    marker.addListener('click', function() {
        service.getDetails(loc, function(result, status) {
            if (status !== google.maps.places.PlacesServiceStatus.OK) {
                console.error(status);
                return;
            }
            populateInfoWindow(this, infowindow);
            console.log("it worked " + this);
            // infowindow.setContent(result.name);
            // infowindow.open(map.marker);
        });
    });
}

function populateInfoWindow(marker, infowindow) {
    if (infowindow.marker == marker) {
        infowindow.setContent('');
            infowindow.marker = marker;
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
            });
            infowindow.open(map, marker);
    }
}