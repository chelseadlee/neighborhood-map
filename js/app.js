var Place = function(data){
    //create observable properties from return location
    this.name = ko.observable(data.name);
    this.address = ko.observable(data.address);
}

//locations model data should be passed
var PlaceListViewModel = function(placesArr) {
    var self = this;

    //delete this line markers don't need to be observed since not data
    // self.markers = ko.observableArray(googleMapsMarkers);
    //create observable array of Place instances
    //

    // this.places = ko.utils.arrayMap(placesArr, function(place) {
    //     return new Place(place.name, place.address);
    // });

    self.places = ko.observableArray([]);

    placesArr.forEach(function(place) {
        self.places.push( new Place(place) );
    });

    self.queryText = ko.observable("");

    // filter the marker locations using ko utility filter
    self.filteredList = ko.computed( function() {
        var filter = self.queryText().toLowerCase();
        if (!filter) {
            console.log("No filter!");
            return self.places();
        } else {
            return ko.utils.arrayFilter(self.places(), function(place) {
                var string = place.name().toLowerCase();
                console.log("hey " + string);
                return (string.indexOf(filter) !== -1);
            });
        }
    }, PlaceListViewModel);

    // placesArr.forEach(function(placeItem) {
    //     self.places.push (new Place(placeItem));
    // });
}



//********* Google Maps API **********//

var map;
var service;
var infowindow;

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

}

// findLocations function stores returned places in places array
function findLocations(results, status){
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        // for (var i = 0; i < results.length; i++) {
        //     var place = results[i];
        //     //store returned places in locations array, this is your data/model
        //     // results.forEach(function(place) {
        //     //     placesArr.push( new Place (place));
        //     // })
        //     placesArr.push( results[i] );
        //     // placesArr.push(results[i]);
        //     createMarker(results[i]);
        //     // markers.push(results[i]);
        // }
    ko.applyBindings(new PlaceListViewModel(results));//markers should be locations
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