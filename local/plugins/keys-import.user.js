// ==UserScript==
// @id             iitc-plugin-keys-import@dnc
// @name           IITC plugin: Import keys
// @category       Keys
// @version        0.1.0.20130716.230658
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [local-2013-07-16-230658] Import the list of portal keys from your inventory. Install the 'Keys' plugin first.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @include        https://m-dot-betaspike.appspot.com/handshake*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @match          https://m-dot-betaspike.appspot.com/handshake*
// @grant          none
// ==/UserScript==

function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.importkeys = function() {};

window.plugin.importkeys.APPSPOT_URL = 'https://m-dot-betaspike.appspot.com';

window.plugin.importkeys._dialog = null;

window.plugin.importkeys.messageCallback = function(event) {
  if (event.origin !== window.plugin.importkeys.APPSPOT_URL) {
    return;
  }
  try {
    var object = window.JSON.parse(event.data);
    localStorage[window.plugin.keys.LOCAL_STORAGE_KEY] = event.data;
    if (window.plugin.importkeys._dialog) {
      $(window.plugin.importkeys._dialog).dialog('close');
      window.plugin.importkeys._dialog = null;
    }
    window.plugin.keys.keys = object['keys'];
    window.plugin.keys.updateDisplayCount();
    window.runHooks('pluginKeysRefreshAll');
    alert('Inventory import was successful');
  } catch (e) {
    alert('There was an error parsing the inventory data\n' + e);
  }
};

window.plugin.importkeys.openDialog = function(event) {
  if (!window.plugin.keys) {
    alert('Error: The Keys plugin must be installed before using the Import Keys plugin');
    return;
  }
  if (window.plugin.importkeys._dialog) {
    return;
  }
  var handshakeUrl = window.plugin.importkeys.APPSPOT_URL + '/handshake?json='
    + encodeURIComponent(window.JSON.stringify({'nemesisSoftwareVersion': '2013-07-12T15:48:09Z d6f04b1fab4f opt', 'deviceSoftwareVersion': '4.1.1'}));
  var div = document.createElement('div');
  var span = document.createElement('span');
  span.appendChild(document.createTextNode('Log in below to import your Ingress inventory. (Or try again in a '));
  var a = document.createElement('a');
  a.appendChild(document.createTextNode('new window'));
  a.setAttribute('href', handshakeUrl);
  a.setAttribute('target', '_blank');
  span.appendChild(a);
  span.appendChild(document.createTextNode(')'));
  div.appendChild(span);
  var br = document.createElement('br');
  div.appendChild(br);
  var iframe = document.createElement('iframe');
  iframe.style.width = '300px';
  iframe.style.height = '200px';
  iframe.setAttribute('src', handshakeUrl);
  div.appendChild(iframe);
  var html = div.innerHTML;
  var dialog = window.dialog({
    html: html,
    title: 'Import Keys',
    dialogClass: 'ui-dialog-import-keys',
    id: 'import-keys-dialog',
    closeCallback: function() {
      window.plugin.importkeys._dialog = null;
    }
  });
  window.plugin.importkeys._dialog = dialog;
}

var setup = function() {
  $('head').append('<style>' +
    '.ui-dialog-import-keys { max-width: 800px !important; width: auto !important; }' +
    '</style>');
  window.addEventListener('message', window.plugin.importkeys.messageCallback, false);
  var a = document.createElement('a');
  a.appendChild(document.createTextNode('Import keys'));
  a.setAttribute('title', 'Import all the portal keys from your Ingress inventory');
  a.addEventListener('click', window.plugin.importkeys.openDialog, false);
  document.getElementById('toolbox').appendChild(a);
};

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

// The code below needs to be run on the m-dot-betaspike.appspot.com domain.
// As such, it needs to be outside of the standard IITC plugin wrapper.
(function(){
function inventoryCallback(event)
{
  if (event.target.readyState == 4) {
    if (event.target.status == 200) {
      var json_text = event.target.response;
      var result = window.JSON.parse(json_text);
      var inventory = result['gameBasket']['inventory'];
      var hash = {};
      for (var i = 0; i < inventory.length; i++) {
        if (inventory[i][2]['portalCoupler']) {
          var guid = inventory[i][2]['portalCoupler']['portalGuid'];
          if (hash[guid]) {
            hash[guid]++;
          } else {
            hash[guid] = 1;
          }
        }
      }
      var json_out = window.JSON.stringify({'keys':hash});
      window.top.postMessage(json_out, 'http://www.ingress.com/');
      window.top.postMessage(json_out, 'https://www.ingress.com/');
    } else {
      alert('An error was received from the server\n' + event.target.status + ' ' + event.target.statusText);
    }
  }
}

if (window.location.host == 'm-dot-betaspike.appspot.com') {
  if (window.location.pathname == '/handshake') {
    var xsrf;
    var re_match = document.body.innerHTML.match(/"xsrfToken":"((?:\\"|[^"])*)"/);
    if (!re_match) {
      alert("Error: Couldn't parse XSRF Token from Ingress handshake reply");
      xsrf = '';
    } else {
      xsrf = re_match[1];
    }
    var xhr = new XMLHttpRequest();
    var url = 'https://m-dot-betaspike.appspot.com/rpc/playerUndecorated/getInventory';
    var params = {'lastQueryTimestamp': 0};
    var body = window.JSON.stringify({'params': params});
    xhr.onreadystatechange = inventoryCallback;
    xhr.open('POST', url, true);
    xhr.setRequestHeader('X-XsrfToken', xsrf);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.setRequestHeader('Accept-Encoding', 'gzip');
    xhr.setRequestHeader('User-Agent', 'Nemesis (gzip)');
    xhr.send(body);
  }
}
})();


