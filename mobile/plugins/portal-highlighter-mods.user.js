// ==UserScript==
// @id             iitc-plugin-highlight-portals-mods@vita10gy
// @name           IITC plugin: highlight portal mods
// @category       Highlighter
// @version        0.1.0.20130817.153349
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [mobile-2013-08-17-153349] Uses the fill color of the portals to denote if the portal has the selected mod. 
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
window.plugin.portalHighligherMods = function() {};

window.plugin.portalHighligherMods.highlight = function(data, mod_type) {
  var d = data.portal.options.details;
  
  if(!jQuery.isArray(mod_type)) {
    mod_type = [mod_type];
  }
  
  var mod_effect = 0;
  $.each(d.portalV2.linkedModArray, function(ind, mod) {
    if(mod !== null && jQuery.inArray(mod.type, mod_type) > -1) {
      switch(mod.rarity){
        case 'COMMON':
          mod_effect++;
          break;
        case 'RARE':
          mod_effect+=2;
          break;
        case 'VERY_RARE':
          mod_effect+=3;
          break;
      }
    }
  });
  
  if(mod_effect > 0) {
    var fill_opacity = mod_effect/12*.8 + .2;
    var color = 'red';
    fill_opacity = Math.round(fill_opacity*100)/100;
    var params = {fillColor: color, fillOpacity: fill_opacity};
    data.portal.setStyle(params);
  }

  window.COLOR_SELECTED_PORTAL = '#f0f';
}

window.plugin.portalHighligherMods.highlightNoMods = function(data) {
  var d = data.portal.options.details;
  
  var mods = false;
  $.each(d.portalV2.linkedModArray, function(ind, mod) {
    if(mod !== null) {
      mods = true;
      return;
    }
  });
  
  if(!mods) {
    var fill_opacity = .6;
    var color = 'red';
    var params = {fillColor: color, fillOpacity: fill_opacity};
    data.portal.setStyle(params);
  }

  window.COLOR_SELECTED_PORTAL = '#f0f';
}


window.plugin.portalHighligherMods.getHighlighter = function(type) {
  return(function(data){ 
    window.plugin.portalHighligherMods.highlight(data,type);
  });  
}


var setup =  function() {
  
  $.each(MOD_TYPE, function(ind, name){
    window.addPortalHighlighter('Mod: '+name, window.plugin.portalHighligherMods.getHighlighter(ind));  
  });
  
  window.addPortalHighlighter('Mod: Hackability', window.plugin.portalHighligherMods.getHighlighter(['MULTIHACK', 'HEATSINK']));
  window.addPortalHighlighter('Mod: Attack', window.plugin.portalHighligherMods.getHighlighter(['FORCE_AMP', 'TURRET']));
  window.addPortalHighlighter('Mod: Defense', window.plugin.portalHighligherMods.getHighlighter(['RES_SHIELD', 'FORCE_AMP', 'TURRET']));
  window.addPortalHighlighter('Mod: None', window.plugin.portalHighligherMods.highlightNoMods);
  
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


