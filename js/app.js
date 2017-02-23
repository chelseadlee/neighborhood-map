'use strict';

var Place = function (data, yData, selectPlace, highlight) {
    var self = this;
    // create observable properties from return location
    this.id = data.place_id;
    this.name = data.name;
    this.address = data.formatted_address;
    this.website = data.website;
    this.phone = data.formatted_phone_number;
    this.rating = data.rating;
    this.geometry = data.geometry.location;
    this.googleUrl = data.url;
    this.linkedGoogleRating = ko.computed(function () {
        return '<a class="rating-link" href="' + self.googleUrl + '"><div class="rating-button">Google Rating: ' + self.rating + '</div></a>';
    });
    this.marker = new google.maps.Marker({
        name: this.name,
        map: map,
        icon: defaultMarker,
        position: this.geometry,
        animation: google.maps.Animation.DROP,
        visible: true
    }, this);
    if (!yData) {
        this.yelpRating = ko.observable(yData);
        this.yelpUrl = ko.observable('');
        this.yelpError = ko.observable('Error! Yelp failed to load. Please try again later.');
    } else {
        this.yelpRating = ko.observable(yData.businesses[0].rating);
        this.yelpUrl = ko.observable(yData.businesses[0].url);
        this.linkedYelpRating = ko.computed(function () {
            return '<a class="rating-link" href="' + self.yelpUrl() + '"><div class="rating-button">Yelp Rating: ' + self.yelpRating() + '</div></a>';
        });
    }
    this.marker.addListener('click', function () {
        selectPlace(self);
    });
    this.marker.addListener('mouseover', function () {
        highlight(self, highlightedMarker);
    });
};

var PlaceListViewModel = function (placesArr) {
    var self = this;

    // toggle side panel
    self.panelOpen = ko.observable(false);
    self.toggleExpand = function() {
        self.panelOpen(!self.panelOpen());
    };

    var selectedPlace;
    // this ko observable controls visibility of place details display area
    self.showDetails = ko.observable('');
    // select place by clicking on place in panel view or on map markers
    self.selectPlace = function (place) {
        if (selectedPlace) {
            // if a place is already selected, unhighlight marker and remove details from panel
            self.highlight(selectedPlace, defaultMarker);
            self.showDetails('');
        }

        if (place) {
            // when place is selected, show details in panel and infowindow, highlight marker
            console.log(place.name);
            self.showDetails(place.id);
            self.highlight(place, highlightedMarker);
            self.populateInfoWindow(place);
        }

        // set selected place
        selectedPlace = place;
    };


    // set info window details
    self.populateInfoWindow = function (place) {
        var placename = '<h4 id="iw-name" class="iw-text" >' + place.name + '</h4>';
        var placewebsite = '<p id="iw-website" class="iw-text"><a class="iw-website" href="' + place.website + '">website</a></p>';
        var placeaddress = '<p class="iw-text">' + place.address + '</p>';
        var placephone = '<p>' + place.phone + '</p>';
        var googlerating = '<a href="' + place.googleUrl + '"><div id="google-rating"class="iw-rating"><span class="rating-label"><b>Google</b> Rating:</span> <br/><span class="rating-num">' + place.rating + '</span></div></a>';
        var yelprating = '<a href="' + place.yelpUrl() + '"><div id="yelp-rating" class="iw-rating"><span class="rating-label"><b>Yelp</b> Rating:</span> <br/><span class="rating-num">' + place.yelpRating() + '</span></div></a>';
        // if yelp error, add error text
        if (self.yelpError) {
            var yelpError = '<a href="#"><div class="iw-error"><span>' + place.yelpError() + '</span></div></a>';
            infowindow.setContent(placename + placewebsite + placeaddress + placephone + googlerating + '<br />' + yelpError);
        } else {
            infowindow.setContent(placename + placewebsite + placeaddress + placephone + googlerating + yelprating);
        }
        // deselect place on close click
        infowindow.addListener('closeclick', function () {
            self.selectPlace(null);
        });
        infowindow.open(map, place.marker);
    };

    // change marker color (highlights or unhighlights by changing marker icon)
    self.highlight = function (place, marker) {
        ko.utils.arrayForEach(self.filteredList(), function (place) {
            place.marker.setIcon(defaultMarker);
        });
        place.marker.setIcon(marker);
    };

    // set empty observable array for places
    self.places = ko.observableArray([]);


    //********* load Yelp API **********//
    self.getYelpData = function (placeLoc, callback) {
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
                oauth_timestamp: Math.floor(Date.now() / 1000),
                oauth_signature_method: 'HMAC-SHA1',
                oauth_version: '1.0',
                callback: 'cb',
                location: 'Seattle',
                term: name
            },
            consumerSecret = 'gzFGe9GulzBxi2zyV5M0TN3dPIU',
            tokenSecret = 'ypxDSqySN4bf7Avp8ANucYDyKL8';
        // generates a RFC 3986 encoded, BASE64 encoded HMAC-SHA1
        var encodedSignature = oauthSignature.generate(httpMethod, yelp_url, parameters, consumerSecret, tokenSecret, {
            encodeSignature: false
        });
        parameters.oauth_signature = encodedSignature;

        // Yelp settings
        var settings = {
            url: yelp_url,
            data: parameters,
            cache: true,
            dataType: 'jsonp',
            success: function (results) {
                callback(results);
            },
            error: function () {
                callback('error');
            }
        }

        $.ajax(settings);
    };

    self.yelpError = false;
    // get google place details by looping through nearby places
    placesArr.forEach(function (nearbyPlace) {
        var otherCallbackReturned = false;
        var googlePlaceDetails = null;
        var yData = null;

        // get details from Google Maps Place Details
        service.getDetails({
            placeId: nearbyPlace.place_id,
            geometry: nearbyPlace.geometry.location
        }, function (placeDetails, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                // if yelp api data is returned first
                if (otherCallbackReturned) {
                    // handle yelp error
                    if (yData === "error") {
                        self.yelpError = true;
                        yData = null;
                        self.places.push(new Place(placeDetails, yData, self.selectPlace, self.highlight));
                    } else {
                        self.places.push(new Place(placeDetails, yData, self.selectPlace, self.highlight));
                    }
                }
            } else {
                // handle Google Places error
                errorMsg('Google Places: ' + status + " place: " + nearbyPlace.name);
            }
            // set otherCallbackReturned to true if this callback executes first
            otherCallbackReturned = true;
            googlePlaceDetails = placeDetails;
        });

        // get yelp data if google data is returned first
        // TODO: set up promises...
        self.getYelpData(nearbyPlace, function (results) {
            if (otherCallbackReturned && googlePlaceDetails) {
                // handle yelp error
                if (results === 'error') {
                    self.yelpError = true;
                    results = null;
                    self.places.push(new Place(googlePlaceDetails, results, self.selectPlace, self.highlight));
                }
                self.places.push(new Place(googlePlaceDetails, results, self.selectPlace, self.highlight));
            }
            yData = results;
            // set otherCallbackReturned to true if this callback executes first
            otherCallbackReturned = true;
        });
    });


    // Filter place list results by query text
    self.queryText = ko.observable('');

    // filter the marker locations using ko utility filter
    self.filteredList = ko.computed(function () {
        var filter = self.queryText().toLowerCase();
        // if no filter is applied, return all places
        if (!filter) {
            // make each marker visible
            var unfiltered = ko.utils.arrayFilter(self.places(), function (place) {
                place.marker.setVisible(true);
            });
            if (infowindow) {
                infowindow.close();
            }
            return self.places();
        } else {
            var filtered = ko.utils.arrayFilter(self.places(), function (place) {
                // reset all markers as invisible
                place.marker.setVisible(false);
                var string = place.name.toLowerCase();
                // return all places that match filter query by name
                return (string.indexOf(filter) !== -1);
            });
            filtered.forEach(function (place) {
                // for each place returned in filtered array, set marker to visible
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
    // set map center to Ballard, Seattle
    var ballard = new google.maps.LatLng(47.6686195, -122.3828064);

    map = new google.maps.Map(document.getElementById('map'), {
        center: ballard,
        zoom: 15,
        mapTypeControl: false,
        zoomControl: true,
        zoomControlOptions: {
            // move map zoom control to bottom center
            position: google.maps.ControlPosition.BOTTOM_LEFT
        }
    });

    // marker styles
    defaultMarker = makeMarkerIcon('655656');
    highlightedMarker = makeMarkerIcon('c74438');

    // create info window
    infowindow = new google.maps.InfoWindow({
        maxWidth: 200
    });

    //Make Google Map responsive by centering map on window resize.
    google.maps.event.addDomListener(window, 'resize', function () {
        var center = map.getCenter();
        google.maps.event.trigger(map, 'resize');
        map.setCenter(center);
    });

    // add listener to map so that clicking outside of infowindow will close it
    // and deselect place
    google.maps.event.addListener(map, 'click', function (event) {
        if (infowindow) {
            infowindow.close();
            vm.selectPlace(null);
        }
    });

    // callback for nearby search service
    var request = {
        location: ballard,
        radius: '500',
        keyword: 'coffee'
    };

    service = new google.maps.places.PlacesService(map);
    // places array initialized in findLocations callback
    service.nearbySearch(request, findLocations);
}

// findLocations function stores returned places in places array
function findLocations(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        // create view model, passing in places array
        vm = new PlaceListViewModel(results);
        ko.applyBindings(vm);
    } else {
        errorMsg('Google Places');
    }
}

// Thanks to the Google Maps API course for this marker customizer
// Function takes in a color and then creates a new marker icon of that color.
// Icon will be 21px wide by 34px high with an origin of 0,0 and anchored at 10,34.
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}

// error handling

// general error message
function errorMsg(problem) {
    console.log('error loading ' + problem);
    alert('Error loading ' + problem + '. Please try again later!');
}

// Google Maps async load callback
function googleSuccess() {
    if (typeof google !== 'undefined') {
        initMap();
    } else {
        console.log('google undefined');
    }
}

// google Error, for Google Maps async load fallback
function googleError() {
    errorMsg('Google Maps');
}