// ==UserScript==
// @id             iitc-plugin-players-portal-pictures
// @name           IITC plugin: Player's Portal Pictures
// @version        0.1.0.20130817.153349
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [mobile-2013-08-17-153349] This plugin finds portal pictures submitted by a given player. The input is in the sidebar.
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

/*********************************************************************************************************
* Changelog:
*
* 0.1.0 First public release, supports only cover photos for now.
*********************************************************************************************************/

// use own namespace for plugin
window.plugin.playersPortalPictures = function() {};

window.plugin.playersPortalPictures.findPictures = function(playername) {
  var s = '';
  var portalSet = {};
  var effectiveNick = '';
  var team = '';
  var portalCounter = 0;
  var pictureCounter = 0;
  var totalVoteCounter = 0;
  // Assuming there can be no agents with same nick with different lower/uppercase
  var nickToFind = playername.toLowerCase();
  $.each(window.portals, function(ind, portal){
      var coverPhotoAttribution = '';
      var attributionMarkup = new Object();
      if(portal.options.details.photoStreamInfo.hasOwnProperty('coverPhoto') && portal.options.details.photoStreamInfo.coverPhoto.hasOwnProperty('attributionMarkup')) {
        attributionMarkup = portal.options.details.photoStreamInfo.coverPhoto.attributionMarkup;
        if(attributionMarkup.length === 2 && attributionMarkup[0] === 'PLAYER') {
          coverPhotoAttribution = attributionMarkup[1].plain;
        } else {
          return true;
        }
      } else {
        return true;
      }

      if(coverPhotoAttribution.toLowerCase() === nickToFind) {
        pictureCounter += 1;
        if(!effectiveNick) {
          effectiveNick = coverPhotoAttribution;
        }
        if(!team) {
          team = attributionMarkup[1].team;
        }
        var votes = 0;
        votes = portal.options.details.photoStreamInfo.coverPhoto.voteCount;
        totalVoteCounter += votes;
        if(!portalSet.hasOwnProperty(portal.options.guid)) {
          portalSet[portal.options.guid] = true;            
          var latlng = [portal.options.details.locationE6.latE6/1E6, portal.options.details.locationE6.lngE6/1E6].join();
          var guid = portal.options.guid;
          var zoomPortal = 'window.zoomToAndShowPortal(\''+guid+'\', ['+latlng+']);return false';
          var perma = '/intel?latE6='+portal.options.details.locationE6.latE6+'&lngE6='+portal.options.details.locationE6.lngE6+'&z=17&pguid='+guid;
          var a = $('<a>',{
              'class': 'help',
              text: portal.options.details.portalV2.descriptiveText.TITLE,
              title: portal.options.details.portalV2.descriptiveText.ADDRESS,
              href: perma,
              onClick: zoomPortal
              })[0].outerHTML;
          portalCounter += 1;
          s += a + ': ';
        }
        s += votes + ' votes<br/>';
      }
  });
  if (s) {
    // Showing the playername as a "fake" link to avoid the auto-mouseover effect on the first portal
    fakeLinkPlayer = '<a href="#" class="'+ (team === 'RESISTANCE' ? 'res' : 'enl') + ' nickname">' + effectiveNick + '</a>';
    s = fakeLinkPlayer + ' has pictures on ' + portalCounter + ' portals with ' + totalVoteCounter + ' total votes:<br/></br>' + s;
  } else {
    s = playername + ' has no portal pictures in this range<br/>';
  }
  window.dialog({
    title: playername + '\'s portal pictures',
    html: s,
    id: 'playerPortalPictures',
    width: 500
  });
}

var setup = function() {
  var content = '<input id="playerPortalPicture" placeholder="Type player name to find portal pictures..." type="text">';
  $('#sidebar').append(content);
  $('#toolbox').append('  <a onclick=$("#playerPortalPicture").focus() title="Find all portals with pictures submitted by a certain player">Player\'s Portal Pictures</a>');
  $('#playerPortalPicture').keypress(function(e) {
    if((e.keyCode ? e.keyCode : e.which) !== 13) return;
    var data = $(this).val();
    window.plugin.playersPortalPictures.findPictures(data);
  });
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


