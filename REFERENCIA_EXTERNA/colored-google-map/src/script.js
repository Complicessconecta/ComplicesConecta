
+function ($) {

  'use strict';

  var GoogleMap = function (element, options) {
    this.element = element ? element : '[data-render=googlemap]';
    this.options = options ? options : GoogleMap.defaults;

    return this;
  }

  GoogleMap.prototype.start = function () {
    var option  = this.options;
        option.map.center = new google.maps.LatLng(option.map.latitude, option.map.longitude)

    var element = document.getElementById(option.target),
        render  = new google.maps.Map(element, option.map);

    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(option.map.latitude, option.map.longitude),
      map: render,
      title: option.info.title
    });
  };

  GoogleMap.defaults = {
    // Target Div Selector
    target: 'map',

    // Map Information
    info: {
      description: ' We find top quality vehicles, put them through a rigorous 120-point inspection, and offer them at the absolute lowest prices possible. ',
      telephone:   '587-293-9009',
      email:       'accelerateautosales@live.ca',
      icon:        '',
      web:         'www.accelerateautosales.com',
      tel:         'Accelerate Auto Sales'
    },

    // Map Options
    map: {
      latitude:  51.0828781,
      longitude: -113.9886477,
      draggable : true,
      disableDoubleClickZoom: true,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      },
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      overviewMapControl: false,
      overviewMapControlOptions: {
        opened: false,
      },
      panControl: false,
      scaleControl: false,
      scrollwheel: false,
      zoom: 15,
      zoomControl: true,
      zoomControlOptions: {
        style: google.maps.ZoomControlStyle.LARGE,
      },
      // Cobalt Theme
      styles: [
        { 'featureType': 'all',
          'elementType': 'all',
          'stylers': [
            { 'invert_lightness': true },
            { 'saturation': 10 },
            { 'lightness': 30 },
            { 'gamma': 0.5 },
            { 'hue': '#435158' }
          ]
        }
      ]
    },

    // Heads Up Display
    hud: {
      zoom: 15,
      panControl: false,
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      overviewMapControl: false,
      scrollwheel: false,
      disableDoubleClickZoom: true
    }
  };

  if ($('#map').length > 0) {
    var gmap = new GoogleMap();

    google.maps.event.addDomListener(window, 'load', gmap.start());
  }

}(window.jQuery);