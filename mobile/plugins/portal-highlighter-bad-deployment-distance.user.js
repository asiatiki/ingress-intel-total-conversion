// ==UserScript==
// @id             iitc-plugin-highlight-bad-deployment-distance@cathesaurus
// @name           IITC plugin: highlight badly-deployed portals
// @category       Highlighter
// @version        0.1.0.20130817.153349
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [mobile-2013-08-17-153349] Uses the fill color of the portals to show the effective resonator deployment range, where that average is less than 36 metres
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
window.plugin.portalHighlighterBadDeploymentDistance = function() {};

window.plugin.portalHighlighterBadDeploymentDistance.highlight = function(data) {
  var d = data.portal.options.details;
  var portal_deployment = 0;
  if(getTeam(d) !== 0) {
    if(window.getAvgResoDist(d) > 0 && window.getAvgResoDist(d) < window.HACK_RANGE*0.9) {
      portal_deployment = (window.HACK_RANGE - window.getAvgResoDist(d))/window.HACK_RANGE;
    }
    if(portal_deployment > 0) {
      var fill_opacity = portal_deployment*.85 + .15;
      color = 'red';
      var params = {fillColor: color, fillOpacity: fill_opacity};
      data.portal.setStyle(params);
    } 
  }
  window.COLOR_SELECTED_PORTAL = '#f0f';
}

var setup =  function() {
  window.addPortalHighlighter('Bad Deployment Distance', window.plugin.portalHighlighterBadDeploymentDistance.highlight);
}

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


