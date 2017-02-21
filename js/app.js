'use strict';

var Place = function(data, yData, selectPlace, highlight){
    var self = this;
    // create observable properties from return location
    this.id = data.place_id;
    this.name = ko.observable(data.name);
    this.address = ko.observable(data.formatted_address);
    this.website = ko.observable(data.website);
    this.phone = ko.observable(data.formatted_phone_number);
    this.rating = ko.observable(data.rating);
    this.geometry = ko.observable(data.geometry.location);
    this.googleUrl = ko.observable(data.url);
    this.marker = new google.maps.Marker({
        name: this.name(),
        map: map,
        icon: defaultMarker,
        position: this.geometry(),
        animation: google.maps.Animation.DROP,
        visible: true
    }, this);
    this.yelpRating = ko.observable(yData.businesses[0].rating);
    this.yelpUrl = ko.observable(yData.businesses[0].url);
    this.marker.addListener('click', function() {
        selectPlace(self);
    });
    this.marker.addListener('mouseover', function() {
        highlight(self, highlightedMarker);
    });
};

var PlaceListViewModel = function(placesArr) {
    console.log("view model");
    var self = this;

    var selectedPlace;
    // this ko observable controls visibility of place details display area
    self.showDetails = ko.observable('');
    // select place by clicking on place in panel view or on map markers
    self.selectPlace = function(place) {
        if (selectedPlace) {
            // if a place is already selected, unhighlight marker and remove details from panel
            self.highlight(selectedPlace, defaultMarker);
            self.showDetails('');
        }

        // if valid place is selected
        if (place) {
            // when place is selected, show details in panel and infowindow, highlight marker
            console.log(place.name());
            self.showDetails(place.name);
            self.highlight(place, highlightedMarker);
            self.populateInfoWindow(place);
        }

        // set selected place
        selectedPlace = place;
    };

    // set info window details
    self.populateInfoWindow = function(place) {
        var placename = '<h4 id="iw-name" class="iw-text" >' + place.name() + '</h4>';
        var placeaddress = '<p class="iw-text">' + place.address() + '</p>';
        var placephone = '<a id="iw-phone-number" class="iw-text" href="tel:"' + place.phone() + '">  ' + place.phone() + ' </a>';
        var placewebsite = '<a id="iw-website" class="iw-text" href="' + place.website() + '">website</a>';
        var googlerating = '<a class="ratingbox" href="' + place.googleUrl() + '"><div id="google-rating"class="iw-rating"><span class="rating-label">Google Rating:</span> <br/><span class="rating-num">' + place.rating() + '</span></div></a>';
        var yelprating = '<a class="ratingbox" href="' + place.yelpUrl() + '"><div id="yelp-rating" class="iw-rating"><span class="rating-label">Yelp Rating:</span> <br/><span class="rating-num">' + place.yelpRating() + '</span></div></a>';
        infowindow.setContent(placename + placeaddress + '<p>' + placephone + placewebsite + '</p>' + googlerating + yelprating);
        // deselect place on close click
        infowindow.addListener('closeclick', function() {
            self.selectPlace(null);
        });
        infowindow.open(map, place.marker);
    };

    // change marker color (highlights or unhighlights by changing marker icon)
    self.highlight = function(place, marker) {
        ko.utils.arrayForEach(self.filteredList(), function(place) {
            place.marker.setIcon(defaultMarker);
        })
            place.marker.setIcon(marker);
    };

    // set empty observable array for places
    self.places = ko.observableArray([]);


    //********* load Yelp API **********//
    self.getYelpData = function(placeLoc, callback) {
        // Read API keys
        function nonce_generate() {
            return (Math.floor(Math.random() * 1e12).toString());
        }
        var name = placeLoc.name;
        var yelp_url = 'https://api.yelp.com/v2/search?';
        var httpMethod = 'GET',
            parameters = {
                oauth_consumer_key: '62Dis_EM2VpJWMj5HJmN2g',
                oauth_token: 'z26Io3gYEFHJTZHSJJdt6N2Mu6N6bLJ5',
                oauth_nonce: nonce_generate(),
                oauth_timestamp: Math.floor(Date.now()/1000),
                oauth_signature_method: 'HMAC-SHA1',
                oauth_version: '1.0',
                callback: 'cb',
                location: 'Seattle',
                term: name
            },
            consumerSecret = 'gzFGe9GulzBxi2zyV5M0TN3dPIU',
            tokenSecret =  'ypxDSqySN4bf7Avp8ANucYDyKL8';
            // generates a RFC 3986 encoded, BASE64 encoded HMAC-SHA1
        var encodedSignature = oauthSignature.generate(httpMethod, yelp_url, parameters, consumerSecret, tokenSecret, {encodeSignature: false});
            parameters.oauth_signature = encodedSignature;

        // Yelp settings
        var settings = {
            url: yelp_url,
            data: parameters,
            cache: true,
            dataType: 'jsonp',
            success: function(results) {
                callback(results);
            },
            error: function() {
                errorMsg("Yelp");
            }
        }

        $.ajax(settings);
    };

    // get google place details by looping through nearby places
    placesArr.slice(0, 3).forEach(function(nearbyPlace) {
        var otherCallbackReturned = false;
        var googlePlaceDetails = null;
        var yData = null;

        // get details from Google Maps Place Details
        service.getDetails({
            placeId: nearbyPlace.place_id,
            geometry: nearbyPlace.geometry.location
        }, function (placeDetails, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                if(otherCallbackReturned){
                    self.places.push(new Place(placeDetails, yData, self.selectPlace, self.highlight));
                }
            } else {
                errorMsg("Google Places");
            }
            otherCallbackReturned = true;
            googlePlaceDetails = placeDetails;
        });

        self.getYelpData(nearbyPlace, function(results){
            if(otherCallbackReturned){
                self.places.push(new Place(googlePlaceDetails, results, self.selectPlace, self.highlight));
            }
            yData = results;
            otherCallbackReturned = true;
        });
    });

    self.queryText = ko.observable("");

    // filter the marker locations using ko utility filter
    self.filteredList = ko.computed( function() {
        var filter = self.queryText().toLowerCase();
        if (!filter) {
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

var map,
    service,
    infowindow,
    defaultMarker,
    highlightedMarker,
    visitedMarker,
    vm;

//********* Google Maps API **********//

function initMap() {
    console.log("init map");
    // set map center to Ballard, Seattle
    var ballard = new google.maps.LatLng(47.6686195,-122.3828064);

    map = new google.maps.Map(document.getElementById('map'), {
        center: ballard,
        zoom: 15,
        mapTypeControl: true,
        mapTypeControlOptions: {
            // move map control style to right top
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_CENTER
        },
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.BOTTOM_CENTER
        }
    });

    // marker
    defaultMarker = makeMarkerIcon('655656');
    highlightedMarker = makeMarkerIcon('c74438');

    infowindow = new google.maps.InfoWindow({
        maxWidth: 200
    });

    var request  = {
        location: ballard,
        radius: '500',
        keyword: 'coffee'
    };

    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, findLocations);
    //once locations array initialized in findLocations callback
    //the view model can be initialized pass into the constructor function

    //Make Google Map responsive by centering map on window resize.
    google.maps.event.addDomListener(window, "resize", function() {
        var center = map.getCenter();
        google.maps.event.trigger(map, "resize");
        map.setCenter(center);
    });

    // add listener to map so that clicking outside of infowindow will close it
    // and deselect place
    google.maps.event.addListener(map, "click", function(event) {
        if (infowindow) {
            infowindow.close();
            vm.selectPlace(null);
        }
    });
}

// findLocations function stores returned places in places array
function findLocations(results, status){
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        // create view model, passing in results of nearby search service
        vm = new PlaceListViewModel(results);
        ko.applyBindings(vm);
    }
    else {
        alert("Google Places Failed to Load. Try again later.");
    }
}

// Thanks to the Google Maps API course for this marker customizer
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

function errorMsg(problem) {
    console.log("error loading " + problem);
}

// var googleError = function() {
//     alert("Error loading Google Maps. Please try again later.")
// }