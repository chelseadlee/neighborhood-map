var Place = function(data, selectPlace){
    var self = this;
    //create observable properties from return location
    this.id = data.place_id;
    this.name = ko.observable(data.name);
    this.address = ko.observable(data.formatted_address);
    this.website = ko.observable(data.website);
    this.phone = ko.observable(data.formatted_phone_number);
    this.rating = ko.observable(data.rating);
    this.geometry = ko.observable(data.geometry.location);
    this.marker = new google.maps.Marker({
        name: this.name(),
        map: map,
        icon: defaultMarker,
        position: this.geometry(),
        animation: google.maps.Animation.DROP,
        visible: true
    }, this);

    this.marker.addListener('click', function() {
        selectPlace(self);
    });
};



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
        self.populateInfoWindow(place);
    };

    self.populateInfoWindow = function(place) {
        var placename = '<h4>' + place.name() + '</h4>';
        var placeaddress = '<p>' + place.address() + '</p>';
        var placewebsite = '<a class="website" href="' + place.website() + '">  website  </a>';
        var placephone = '<span class="phone-number">  ' + place.phone() + ' </span>';
        var placerating = '<p>Avg. Google Rating: ' + place.rating() + '</p>';
        infowindow.setContent(placename + placeaddress + '<p>' + placewebsite + placephone + '</p>' + placerating);

        infowindow.open(map, place.marker);
    };

    self.highlight = function(place) {
        ko.utils.arrayForEach(self.filteredList(), function(place) {
            place.marker.setIcon(defaultMarker);
        })
        place.marker.setIcon(highlightedMarker);
    };

    self.places = ko.observableArray([]);

    // get details
    placesArr.slice(0, 3).forEach(function(nearbyPlace) {
        service.getDetails({
            placeId: nearbyPlace.place_id
        }, function (placeDetails, status) {
            self.places.push(new Place(placeDetails, self.selectPlace));
        });
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
};



//********* Google Maps API **********//

var map;
var service;
var infowindow;
var defaultMarker;
var highlightedMarker;

function initMap() {
    console.log("init map");
    var ballard = new google.maps.LatLng(47.6686195,-122.3828064);

    map = new google.maps.Map(document.getElementById('map'), {
        center: ballard,
        zoom: 15
    });

    defaultMarker = makeMarkerIcon('790000');
    highlightedMarker = makeMarkerIcon('00793D');

    infowindow = new google.maps.InfoWindow();

    var request  = {
        location: ballard,
        radius: '500',
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