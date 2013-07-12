// ==UserScript==
// @id             force-https@jonatkins
// @name           IITC plugin: force https access for ingress.com/intel
// @category       Tweaks
// @version        0.1.0.20130712.61928
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [local-2013-07-12-061928] Force https access for ingress.com/intel. If the intel site is accessed via http, it redirects to the https version
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==



//NOTE: plugin authors - due to the unique requirements of this plugin, it doesn't use the standard IITC
//plugin architechure. do NOT use it as a template for other plugins


if(window.location.protocol !== 'https:') {
  var redir = window.location.href.replace(/^http:/, 'https:');
  window.location = redir;
  throw('Need to load HTTPS version.');
}
