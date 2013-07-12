// ==UserScript==
// @id             iitc-plugin-basemap-yandex@jonatkins
// @name           IITC plugin: Yandex maps
// @category       Map Tiles
// @version        0.1.0.20130712.50921
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [local-2013-07-12-050921] Add Yandex.com (Russian/Русский) map layers
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==


function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};



// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.mapTileYandex = function() {};


window.plugin.mapTileYandex.setup = function() {
//a few options on language are available, including en-US. Oddly, the detail available on the maps varies
//dependong on the language
  var yandexApiJs = '//api-maps.yandex.ru/2.0-stable/?load=package.standard&lang=ru-RU'

  load(yandexApiJs).thenRun(window.plugin.mapTileYandex.addLayer);
}

window.plugin.mapTileYandex.addLayer = function() {

//include Yandex.js start
/*
 * L.TileLayer is used for standard xyz-numbered tile layers.
 */
//(function (ymaps, L) {

L.Yandex = L.Class.extend({
	includes: L.Mixin.Events,

	options: {
		minZoom: 0,
		maxZoom: 18,
		attribution: '',
		opacity: 1,
		traffic: false
	},

	// Possible types: map, satellite, hybrid, publicMap, publicMapHybrid
	initialize: function(type, options) {
		L.Util.setOptions(this, options);

		this._type = "yandex#" + (type || 'map');
	},

	onAdd: function(map, insertAtTheBottom) {
		this._map = map;
		this._insertAtTheBottom = insertAtTheBottom;

		// create a container div for tiles
		this._initContainer();
		this._initMapObject();

		// set up events
		map.on('viewreset', this._resetCallback, this);

		this._limitedUpdate = L.Util.limitExecByInterval(this._update, 150, this);
		map.on('move', this._update, this);

		map._controlCorners['bottomright'].style.marginBottom = "3em";

		this._reset();
		this._update(true);
	},

	onRemove: function(map) {
		this._map._container.removeChild(this._container);

		this._map.off('viewreset', this._resetCallback, this);

		this._map.off('move', this._update, this);

		map._controlCorners['bottomright'].style.marginBottom = "0em";
	},

	getAttribution: function() {
		return this.options.attribution;
	},

	setOpacity: function(opacity) {
		this.options.opacity = opacity;
		if (opacity < 1) {
			L.DomUtil.setOpacity(this._container, opacity);
		}
	},

	setElementSize: function(e, size) {
		e.style.width = size.x + "px";
		e.style.height = size.y + "px";
	},

	_initContainer: function() {
		var tilePane = this._map._container,
			first = tilePane.firstChild;

		if (!this._container) {
			this._container = L.DomUtil.create('div', 'leaflet-yandex-layer leaflet-top leaflet-left');
			this._container.id = "_YMapContainer_" + L.Util.stamp(this);
			this._container.style.zIndex = "auto";
		}

		if (this.options.overlay) {
			first = this._map._container.getElementsByClassName('leaflet-map-pane')[0];
			first = first.nextSibling;
			// XXX: Bug with layer order
			if (L.Browser.opera)
				this._container.className += " leaflet-objects-pane";
		}
		tilePane.insertBefore(this._container, first);

		this.setOpacity(this.options.opacity);
		this.setElementSize(this._container, this._map.getSize());
	},

	_initMapObject: function() {
		if (this._yandex) return;

		// Check that ymaps.Map is ready
		if (ymaps.Map === undefined) {
			console.debug("L.Yandex: Waiting on ymaps.load('package.map')");
			return ymaps.load(["package.map"], this._initMapObject, this);
		}

		// If traffic layer is requested check if control.TrafficControl is ready
		if (this.options.traffic)
			if (ymaps.control === undefined ||
			    ymaps.control.TrafficControl === undefined) {
				console.debug("L.Yandex: loading traffic and controls");
				return ymaps.load(["package.traffic", "package.controls"],
					this._initMapObject, this);
			}

		var map = new ymaps.Map(this._container, {center: [0,0], zoom: 0, behaviors: []});

		if (this.options.traffic)
			map.controls.add(new ymaps.control.TrafficControl({shown: true}));

		if (this._type == "yandex#null") {
			this._type = new ymaps.MapType("null", []);
			map.container.getElement().style.background = "transparent";
		}
		map.setType(this._type)

		this._yandex = map;
		this._update(true);
	},

	_resetCallback: function(e) {
		this._reset(e.hard);
	},

	_reset: function(clearOldContainer) {
		this._initContainer();
	},

	_update: function(force) {
		if (!this._yandex) return;
		this._resize(force);

		var center = this._map.getCenter();
		var _center = [center.lat, center.lng];
		var zoom = this._map.getZoom();

		if (force || this._yandex.getZoom() != zoom)
			this._yandex.setZoom(zoom);
		this._yandex.panTo(_center, {duration: 0, delay: 0});
	},

	_resize: function(force) {
		var size = this._map.getSize(), style = this._container.style;
		if (style.width == size.x + "px" &&
		    style.height == size.y + "px")
			if (force != true) return;
		this.setElementSize(this._container, size);
		var b = this._map.getBounds(), sw = b.getSouthWest(), ne = b.getNorthEast();
		this._yandex.container.fitToViewport();
	}
});
//})(ymaps, L)

//include Yandex.js end

  var yStyles = {
    'map': "Map",
    'satellite': "Satellite",
    'hybrid': "Hybrid",
//    'publicMap': "Public Map",
//    'publicMapHybrid': "Public Hybrid",
  };


  var yOpt = {maxZoom: 18};

  $.each(yStyles, function(key,value) {
    var yMap = new L.Yandex(key, yOpt);
    layerChooser.addBaseLayer(yMap, 'Yandex '+value);
  });

};

var setup =  window.plugin.mapTileYandex.setup;

// PLUGIN END //////////////////////////////////////////////////////////


if(window.iitcLoaded && typeof setup === 'function') {
  setup();
} else {
  if(window.bootPlugins)
    window.bootPlugins.push(setup);
  else
    window.bootPlugins = [setup];
}
} // wrapper end
// inject code into site context
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ wrapper +')();'));
(document.body || document.head || document.documentElement).appendChild(script);


