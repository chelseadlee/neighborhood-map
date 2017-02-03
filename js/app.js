var PlaceList = function(data) {
    this.name = ko.observable(data.name);
    this.address = ko.observable(data.address);
};

var Place = function(place){
    //create observable properties from return location
    //this is Cat from catclicker
}

//locations model data should be passed
var PlaceListViewModel = function(googleMapsMarkers) {
    var self = this;

    //delete this line markers don't need to be observed since not data
    self.markers = ko.observableArray(googleMapsMarkers);
    //create observable array of Place instances
    //


    self.filter = ko.observable("");
    // filter the marker locations using ko utility filter
    filteredPlaces = ko.computed(function() {
        var filter = self.filter().toLowerCase();
        if (!filter) {
            return self.markers();
        } else {
            return ko.utils.arrayFilter(self.items(), function(marker) {
                return ko.utils.indexOf(place.name().toLowerCase(), filter);
            });
        }
    }, PlaceListViewModel);

    self.places = ko.observableArray([]);
    self.newPlace = ko.observable();

    markers.forEach(function(placeItem) {
        self.places.push (new Place(placeItem));
    });
}



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
    //once locations array initialized in findLocations callback
    //the view model can be initialized pass into the constructor function
    ko.applyBindings(new PlaceListViewModel(markers));//markers should be locations

}

function findLocations(results, status){
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            var place = results[i];
            //store returned places in locations array, this is your data/model

            createMarker(results[i]);
            markers.push(results[i]);
        }
    }
}

function createMarker(place) {
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        animation: google.maps.Animation.DROP
    });

    marker.addListener('click', function() {
        service.getDetails(place, function(result, status) {
            if (status !== google.maps.places.PlacesServiceStatus.OK) {
                console.error(status);
                return;
            }
            // populateInfoWindow(this, infowindow);
            infowindow.setContent(result.name);
            console.log(JSON.stringify(result));
            infowindow.open(map, marker);
        });
    });
}
// function populateInfoWindow(marker, infowindow) {
//     // if (infowindow.marker == marker) {
//     //     infowindow.setContent('');
//     //         infowindow.marker = marker;
//     //         infowindow.addListener('closeclick', function() {
//     //             infowindow.marker = null;
//     //         });
//     //         infowindow.open(map, marker);
//     // }
//     infowindow.open(map, marker);
// }