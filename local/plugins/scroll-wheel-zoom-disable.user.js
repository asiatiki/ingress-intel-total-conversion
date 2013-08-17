// ==UserScript==
// @id             iitc-plugin-scroll-wheel-zoom-disable@jonatkins
// @name           IITC plugin: disable mouse wheel zoom
// @category       Tweaks
// @version        0.1.0.20130817.153348
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [local-2013-08-17-153348] Disable the use of mouse wheel to zoom. The map zoom controls or keyboard are still available.
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
window.plugin.scrollWheelZoomDisable = function() {};

window.plugin.scrollWheelZoomDisable.setup = function() {

  window.map.scrollWheelZoom.disable();

};

var setup =  window.plugin.scrollWheelZoomDisable.setup;

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


