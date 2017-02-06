var Place = function(data, selectPlace){
    var self = this;
    //create observable properties from return location
    this.name = ko.observable(data.name);
    this.address = ko.observable(data.formatted_address);
    this.id = ko.observable(data.place_id);
    this.geometry = ko.observable(data.geometry.location);
    this.marker = new google.maps.Marker({
        name: this.name(),
        map: map,
        icon: defaultMarker,
        position: this.geometry(),
        animation: google.maps.Animation.DROP,
        visible: true
    }, this);
    this.content = self.name() + " " + self.id();

    this.marker.addListener('click', function() {
        // self.marker.setIcon(highlightedMarker);
        selectPlace(self);
        // infowindow.setContent(self.name());
        // infowindow.open(map, self.marker);
        populateInfoWindow(self);
    });
}



// Info to display in infowindow:
// name, formatted address, hours

// Info to display in LI:
// name, formatted address,

//locations model data should be passed
var PlaceListViewModel = function(placesArr) {
    console.log("view model");
    var self = this;

    var selectedPlace;

    self.displayDetails = ko.observable(false);
    self.selectPlace = function(place) {
        if (selectedPlace) {
            selectedPlace = null;
        }
        selectedPlace = place;
        console.log(selectedPlace.name());
        self.displayDetails = ko.observable(true);
        self.highlight(place);
        populateInfoWindow(place);
    }

    self.highlight = function(place) {
        ko.utils.arrayForEach(self.filteredList(), function(place) {
            place.marker.setIcon(defaultMarker);
        })
        place.marker.setIcon(highlightedMarker);
    }

    self.places = ko.observableArray([]);

    placesArr.forEach(function(place) {
        self.places.push( new Place(place, self.selectPlace) );
    });

    self.queryText = ko.observable("");

    // filter the marker locations using ko utility filter
    self.filteredList = ko.computed( function() {
        var filter = self.queryText().toLowerCase();
        if (!filter) {
            console.log("No filter!");
            return self.places();
        } else {
            var filtered = ko.utils.arrayFilter(self.places(), function(place) {
                place.marker.setVisible(false);
                var string = place.name().toLowerCase();
                console.log("hey " + string);
                return (string.indexOf(filter) !== -1);
            });
            filtered.forEach( function(place) {
                place.marker.setVisible(true);
            });
            return filtered;
        }
    }, PlaceListViewModel);
}



//********* Google Maps API **********//

var map;
var service;
var infowindow;
var defaultMarker;
var highlightedMarker;

function initMap() {
    console.log("init map");
    var ballard = new google.maps.LatLng(47.669525,-122.377396);

    map = new google.maps.Map(document.getElementById('map'), {
        center: ballard,
        zoom: 15
    });

    defaultMarker = makeMarkerIcon('790000');
    highlightedMarker = makeMarkerIcon('00793D');

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
        ko.applyBindings(new PlaceListViewModel(results));
    }
}

// Thanks to the folks from the Google Maps API course for this marker customizer
// Function takes in a color and then creates a new marker icon of that color.
// Icon will be 21px wide by 34px high with an origin of 0,0 and anchored at 10,34.
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
      'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
      '|40|_|%E2%80%A2',
      new google.maps.Size(21, 34),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 34),
      new google.maps.Size(21,34));
  return markerImage;
}

// function createMarker(place) {
//     var marker = new google.maps.Marker({
//         map: map,
//         position: place.geometry.location,
//         animation: google.maps.Animation.DROP
//     });

//     marker.addListener('click', function() {
//         service.getDetails(place, function(result, status) {
//             if (status !== google.maps.places.PlacesServiceStatus.OK) {
//                 console.error(status);
//                 return;
//             }
//             // populateInfoWindow(this, infowindow);
//             infowindow.setContent(result.name);
//             console.log(JSON.stringify(result));
//             infowindow.open(map, marker);
//         });
//     });
// }

function populateInfoWindow (place) {
    infowindow.setContent(place.content);
    infowindow.open(map, place.marker);
}

// function populateInfoWindow (marker, infowindow) {
//     if (infowindow.marker == marker) {
//         infowindow.setContent('');
//             infowindow.marker = marker;
//             infowindow.addListener('closeclick', function() {
//                 infowindow.marker = null;
//             });
//             infowindow.open(map, marker);
//     }
//     infowindow.open(map, marker);
// }

