// ==UserScript==
// @id             iitc-plugin-user-location@cradle
// @name           IITC plugin: User Location
// @version        0.1.1.20130712.50923
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [mobile-2013-07-12-050923] Show user location marker on map
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==


function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};



// PLUGIN START ////////////////////////////////////////////////////////

window.plugin.userLocation = function() {};

window.plugin.userLocation.marker = {};
window.plugin.userLocation.locationLayer = new L.LayerGroup();

window.plugin.userLocation.setup = function() {

    var iconImage = 'data:image/png;base64,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';
    var iconRetImage = 'data:image/png;base64,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';

    plugin.userLocation.icon = L.Icon.Default.extend({options: {
        iconUrl: iconImage,
        iconRetinaUrl: iconRetImage
    }});

    var cssClass = PLAYER.team === 'ALIENS' ? 'enl' : 'res';
    var title = '<span class="nickname '+ cssClass+'" style="font-weight:bold;">' + PLAYER.nickname + '</span>\'s location';

    var marker = L.marker(window.map.getCenter(), {
        title: title,
        icon: new plugin.userLocation.icon()
    });

    // copy location to android clipboard on marker click
    marker.on('click', function(e) {
        window.console.log('marker location');
        var ll = e.target.getLatLng();
        window.androidCopy('https://maps.google.com/?q='+ll.lat+','+ll.lng+'%20('+PLAYER.nickname+')');
    });

    plugin.userLocation.marker = marker;
    marker.addTo(window.map);
    // jQueryUI doesn’t automatically notice the new markers
    window.setupTooltips($(marker._icon));
};

window.plugin.userLocation.updateLocation = function(lat, lng) {
    var latlng = new L.LatLng(lat, lng);
    window.plugin.userLocation.marker.setLatLng(latlng);
}

var setup = window.plugin.userLocation.setup;

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


