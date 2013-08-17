// ==UserScript==
// @id             iitc-plugin-bookmarks@ZasoGD
// @name           IITC plugin: Bookmarks for maps and portals
// @category       Controls
// @version        0.1.55.20130817.153348
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [local-2013-08-17-153348] Save your favorite Maps and Portals and move the intelmap view in a second. The ingress world just a click.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// ==/UserScript==


function wrapper() {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};



// PLUGIN START ////////////////////////////////////////////////////////

	// use own namespace for plugin
	window.plugin.bookmarks = function() {};
	window.plugin.bookmarks.bkmrk_portals = {};
	window.plugin.bookmarks.bkmrk_maps = {};

	window.plugin.bookmarks.disabledMessage;
	window.plugin.bookmarks.contentStarHTML;

	window.plugin.bookmarks.KEY_OTHER_BKMRK = 'idOthers';
	window.plugin.bookmarks.LOCAL_STORAGE_status_box = 'plugin-bookmarks-status-box';
	window.plugin.bookmarks.LOCAL_STORAGE_bkmrk_portals = 'plugin-bookmarks-portals-data';
	window.plugin.bookmarks.LOCAL_STORAGE_bkmrk_maps = 'plugin-bookmarks-maps-data';

/*********************************************************************************************************************/

	//---------------------------------------------------------------------------------------
	// Append a 'star' flag in sidebar.
	//---------------------------------------------------------------------------------------
	window.plugin.bookmarks.addToSidebar = function(){
		if(typeof(Storage) === "undefined"){ $('#portaldetails > .imgpreview').after(plugin.bookmarks.disabledMessage); return; }
		$('#portaldetails > h3.title').before(plugin.bookmarks.contentStarHTML);
		plugin.bookmarks.updateStarPortal();
	}

	//---------------------------------------------------------------------------------------
	// Update the status of the star (when a portal is selected from the map/bookmarks-list)
	//---------------------------------------------------------------------------------------
	window.plugin.bookmarks.updateStarPortal = function(){
		window.plugin.bookmarks.loadBookmarks('bkmrk_portals');
		var guid = window.selectedPortal;
		$('#bookmarkStar').removeClass('favorite');
		$('.bkmrk a.bookmarksLink.selected').removeClass('selected');

		//If current portal is into bookmarks: select bookmark portal from portals list and select the star
		if(localStorage[window.plugin.bookmarks.LOCAL_STORAGE_bkmrk_portals].search(guid) != -1){
			$('#bookmarkStar').addClass('favorite');
			var list = plugin.bookmarks['bkmrk_portals'];
			for(var idFolders in list){
				for(var idBkmrk in list[idFolders]['bkmrk']){
					var portalGuid = list[idFolders]['bkmrk'][idBkmrk]['guid'];
					if(guid == portalGuid){
						$('.bkmrk#'+idBkmrk+' a.bookmarksLink').addClass('selected');
					}
			   }
			}
		}
	}

	//---------------------------------------------------------------------------------------
	// Switch the status of the star
	//---------------------------------------------------------------------------------------
	window.plugin.bookmarks.switchStarPortal = function(){
		var guid = window.selectedPortal;

		//If portal is saved in bookmarks: Remove this bookmark
		if($('#bookmarkStar').hasClass('favorite')){
			var list = plugin.bookmarks['bkmrk_portals'];

			for(var idFolders in list){
				for(var idBkmrk in list[idFolders]['bkmrk']){
					var portalGuid = list[idFolders]['bkmrk'][idBkmrk]['guid'];
					if(guid == portalGuid){
						delete list[idFolders]['bkmrk'][idBkmrk];
						$('.bkmrk#'+idBkmrk+'').remove();
					}
			   }
			}
		}
		//If portal isn't saved in bookmarks: Add this bookmark
		else{
			// Get the bookmark data (name, coordinates, portal id) from the portal link
			var linka = $('#portaldetails .linkdetails aside a:contains("Portal link")').attr('href');
			var namePortal = $('#portaldetails h3').text();
			var ID = window.plugin.bookmarks.generateID();
			var spac = linka.split('pll=');
			var latlng = spac[1] ;

			// Add bookmark in the localStorage
			plugin.bookmarks['bkmrk_portals'][plugin.bookmarks.KEY_OTHER_BKMRK]['bkmrk'][ID] = {"guid":guid,"latlng":latlng,"label":namePortal};
			//Append the new bookmark to the map list
			$('#bkmrk_portals li.othersBookmarks ul').append('<li class="bkmrk" id="'+ID+'"><a class="bookmarksRemoveFrom" title="Remove from bookmarks">X</a><a class="bookmarksLink selected" onclick="window.zoomToAndShowPortal(\''+guid+'\', ['+latlng+']);return false;">'+namePortal+'</a></li>');
		}
		window.plugin.bookmarks.storeBookmarks('bkmrk_portals');
		window.plugin.bookmarks.updateStarPortal();
	}

	//---------------------------------------------------------------------------------------
	// Save a bookmark map
	//---------------------------------------------------------------------------------------
	window.plugin.bookmarks.addBookmarkMap = function(elem){
		// Get the coordinates and zoom level from the permalink
		var mapLink = $(elem).attr('href');
			var pars = new RegExp('[\\?&amp;]ll=([^&amp;#]*)[&amp;]z=([^&amp;#]*)').exec(mapLink);
			var res = pars[1].split(',');
			res[2] = pars[2];
			var latlng = res[0]+','+res[1];
			var zoom = res[2];

			var ID = window.plugin.bookmarks.generateID();

			//Get the label | Convert some characters | Set the input (empty)
			var nameMap = $(elem).siblings('input').val();
			nameMap = nameMap.replace(/\//g, '&#47;').replace(/\\/g, '&#92;').replace(/"/g, '&#34;').replace(/"/g, '&#39;');
			$(elem).siblings('input').val('');

		// Add bookmark in the localStorage
		plugin.bookmarks['bkmrk_maps'][plugin.bookmarks.KEY_OTHER_BKMRK]['bkmrk'][ID] = {"label":nameMap,"latlng":latlng,"z":parseInt(zoom)};
		plugin.bookmarks.storeBookmarks('bkmrk_maps');

		//Append the new bookmark to the map list
		if(nameMap==''){ nameMap = latlng+' ['+zoom+']'; }
		$('#bkmrk_maps li.othersBookmarks ul').append('<li class="bkmrk" id="'+ID+'"><a class="bookmarksRemoveFrom" title="Remove from bookmarks">X</a><a class="bookmarksLink" onclick="map.setView(['+latlng+'], '+zoom+');return false;">'+nameMap+'</a></li>');
	}

/*********************************************************************************************************************/

	//---------------------------------------------------------------------------------------
	// Generate an ID for the bookmark (date time + random number)
	//---------------------------------------------------------------------------------------
	window.plugin.bookmarks.generateID = function(){
		var d = new Date();
		var ID = d.getTime()+(Math.floor(Math.random()*99)+1);
		var ID = 'id'+ID.toString();
		return ID;
	}

	//---------------------------------------------------------------------------------------
	// Switch the status folder to open/close (in the localStorage)
	//---------------------------------------------------------------------------------------
	window.plugin.bookmarks.openFolder = function(elem){
		var typeList = $(elem).parent().parent().parent().parent('div').attr('id');
		var ID = $(elem).parent().parent('li').attr('id');
		var newFlag;
		var flag = plugin.bookmarks[typeList][ID]['state'];
		if(flag){ newFlag = 0; }
		else if(!flag){ newFlag = 1; }
		window.plugin.bookmarks[typeList][ID]['state'] = newFlag;
		window.plugin.bookmarks.storeBookmarks(typeList);
	}

	//---------------------------------------------------------------------------------------
	// Switch the status folder to open/close (in the localStorage)
	//---------------------------------------------------------------------------------------
	window.plugin.bookmarks.addFolder = function(typeList){
		var ID = window.plugin.bookmarks.generateID();
		var input = '#'+typeList+' .addForm input';
		//Get the label | Convert some characters | Set the input (empty)
		var nameFolder = $(input).val();
		nameFolder = nameFolder.replace(/\//g, '&#47;').replace(/\\/g, '&#92;').replace(/"/g, '&#34;').replace(/"/g, '&#39;');
		if(nameFolder == ''){ nameFolder = 'Folder'; }
		$(input).val('');

		// Add new folder in the localStorage
		plugin.bookmarks[typeList][ID] = {"label":nameFolder,"state":1,"bkmrk":{}};
		plugin.bookmarks.storeBookmarks(typeList);
		//Append the new folder to the list
		$('#'+typeList+' li.othersBookmarks').before('<li class="bookmarkFolder active" id="'+ID+'"><span class="folderLabel"><a class="bookmarksRemoveFrom">X</a><a class="bookmarksAnchor"><span></span>'+nameFolder+'</a><span><span></span></span></span><ul></ul></li>');
	}

	//---------------------------------------------------------------------------------------
	// Remove the bookmark (from the localStorage)
	//---------------------------------------------------------------------------------------
	window.plugin.bookmarks.deletBookmark = function(elem){
		var typeList = $(elem).parent().parent().parent().parent().parent('div').attr('id');
		var ID = $(elem).parent('li').attr('id');
		var IDfold = $(elem).parent().parent().parent('li').attr('id');
		delete window.plugin.bookmarks[typeList][IDfold]['bkmrk'][ID];
		window.plugin.bookmarks.storeBookmarks(typeList);
		if(typeList == 'bkmrk_portals'){ window.plugin.bookmarks.updateStarPortal(); }
	}

	//---------------------------------------------------------------------------------------
	// Remove the folder (from the localStorage)
	//---------------------------------------------------------------------------------------
	window.plugin.bookmarks.deletFolder = function(elem){
		var typeList = $(elem).parent().parent().parent().parent('div').attr('id');
		var ID = $(elem).parent().parent('li').attr('id');
		delete plugin.bookmarks[typeList][ID];
		window.plugin.bookmarks.storeBookmarks(typeList);
		if(typeList == 'bkmrk_portals'){ window.plugin.bookmarks.updateStarPortal(); }
	}

	//---------------------------------------------------------------------------------------
	// Saved the new sort of the folders (in the localStorage)
	//---------------------------------------------------------------------------------------
	window.plugin.bookmarks.sortBookmarksFolder = function(typeList){
		window.plugin.bookmarks.loadBookmarks(typeList);
		var newArr = {};
		$('#'+typeList+' li.bookmarkFolder').each(function(){
		    var idFold = $(this).attr('id');
			newArr[idFold] = window.plugin.bookmarks[typeList][idFold];
		});
		window.plugin.bookmarks[typeList] = newArr;
		window.plugin.bookmarks.storeBookmarks(typeList);
	}

	//---------------------------------------------------------------------------------------
	// Saved the new sort of the bookmarks (in the localStorage)
	//---------------------------------------------------------------------------------------
	window.plugin.bookmarks.sortBookmarks = function(typeList){
		window.plugin.bookmarks.loadBookmarks(typeList);
		var list = window.plugin.bookmarks[typeList];
		var newArr = {};

		$('#'+typeList+' li.bookmarkFolder').each(function(){
			var idFold = $(this).attr('id');
			newArr[idFold] = window.plugin.bookmarks[typeList][idFold];
			newArr[idFold].bkmrk = {};
		});

		$('#'+typeList+' li.bkmrk').each(function(){
			window.plugin.bookmarks.loadBookmarks(typeList);
			var idFold = $(this).parent().parent('li').attr('id');
		    var id = $(this).attr('id');

			var list = window.plugin.bookmarks[typeList];
			for(var idFoldersOrigin in list){
				for(var idBkmrk in list[idFoldersOrigin]['bkmrk']){
					if(idBkmrk == id){
						newArr[idFold].bkmrk[id] = window.plugin.bookmarks[typeList][idFoldersOrigin].bkmrk[id];
					}
				}
			}
		});
		window.plugin.bookmarks[typeList] = newArr;
		window.plugin.bookmarks.storeBookmarks(typeList);
	}

	//---------------------------------------------------------------------------------------
	// Update the localStorage
	//---------------------------------------------------------------------------------------
	window.plugin.bookmarks.storeBookmarks = function(typeList){
		var bookmarksObject = {};
		bookmarksObject[typeList] = plugin.bookmarks[typeList];
		var bookmarksObjectJSON = JSON.stringify(bookmarksObject);
		localStorage[plugin.bookmarks['LOCAL_STORAGE_'+typeList]] = bookmarksObjectJSON;
	}

	//---------------------------------------------------------------------------------------
	// Load the localStorage
	//---------------------------------------------------------------------------------------
	window.plugin.bookmarks.loadBookmarks = function(typeList){
		var bookmarksObjectJSON = localStorage[plugin.bookmarks['LOCAL_STORAGE_'+typeList]];
		if(!bookmarksObjectJSON) return;
		var bookmarksObject = JSON.parse(bookmarksObjectJSON);
		plugin.bookmarks[typeList] = bookmarksObject[typeList];
	}

	//---------------------------------------------------------------------------------------
	// Load the bookmarks
	//---------------------------------------------------------------------------------------
	window.plugin.bookmarks.loadList = function(typeList){
		window.plugin.bookmarks.loadBookmarks(typeList);
		var element = '';
		var elementTemp = '';
		var elementExc = '';

		// For each folder
		var list = window.plugin.bookmarks[typeList];
		for(var idFolders in list){
			var folders = list[idFolders];
			var active = '';

			// Create a label and a anchor for the sortable
			var folderLabel = '<span class="folderLabel"><a class="bookmarksRemoveFrom" title="Remove this folder">X</a>';
			folderLabel += '<a class="bookmarksAnchor"><span></span>'+folders['label']+'</a><span><span></span></span></span>';

			if(folders['state']){ active = ' active'; }
			if(idFolders == window.plugin.bookmarks.KEY_OTHER_BKMRK){
				folderLabel = ''; active= ' othersBookmarks active';
			}
			// Create a folder
			elementTemp = '<li class="bookmarkFolder'+active+'" id="'+idFolders+'">'+folderLabel+'<ul>';

			// For each bookmark
			var fold = folders['bkmrk'];
			for(var idBkmrk in fold){
				var btn_link;
				var btn_remove = '<a class="bookmarksRemoveFrom" title="Remove from bookmarks">X</a>';
				var bkmrk = fold[idBkmrk];
				var label = bkmrk['label'];
				var latlng = bkmrk['latlng'];

				// If it's a map
				if(typeList == 'bkmrk_maps'){
					if(bkmrk['label']==''){ label = bkmrk['latlng']+' ['+bkmrk['z']+']'; }
					btn_link = '<a class="bookmarksLink" onclick="map.setView(['+latlng+'], '+bkmrk['z']+');return false;">'+label+'</a>';
				}
				// If it's a portal
				else if(typeList == 'bkmrk_portals'){
					var guid = bkmrk['guid'];
					var btn_link = '<a class="bookmarksLink" onclick="window.zoomToAndShowPortal(\''+guid+'\', ['+latlng+']);return false;">'+label+'</a>';
				}
				// Create the bookmark
				elementTemp += '<li class="bkmrk" id="'+idBkmrk+'">'+btn_remove+btn_link+'</li>';
			}
			elementTemp += '</li></ul>';

			//Add folder 'Others' in last position
			if(idFolders != window.plugin.bookmarks.KEY_OTHER_BKMRK){ element += elementTemp; }
			else{ elementExc = elementTemp; }
		}
		element += elementExc;

		// Append all folders and bookmarks
		$('#'+typeList+' ul').html(element);
	}

/*********************************************************************************************************************/

	//---------------------------------------------------------------------------------------
	// Append the stylesheet
	//---------------------------------------------------------------------------------------
	window.plugin.bookmarks.setupCSS = function(){
		$('<style>').prop('type', 'text/css').html('#bookmarksBox *{\n	display:block;\n	padding:0;\n	margin:0;\n	width:auto;\n	height:auto;\n	font-family:Verdana, Geneva, sans-serif;\n	font-size:13px;\n	line-height:22px;\n	text-indent:0;\n	text-decoration:none;\n}\n#bookmarksBox{\n	margin-top:-200%;\n	position:absolute !important;\n	z-index:4001;\n	top:100px;\n	left:100px;\n}\n#bookmarksBox .addForm, #bookmarksBox #bookmarksTypeBar, #bookmarksBox h5{\n	height:28px;\n	overflow:hidden;\n	color:#fff;\n	font-size:14px;\n}\n#bookmarksBox #topBar, #bookmarksBox #topBar *{\n	height:15px !important;\n}\n#bookmarksBox #topBar *{\n	float:left !important;\n}\n#bookmarksBox .handle{\n	text-indent:-20px;\n	width:209px;\n	text-align:center;\n	color:#fff;\n	line-height:8px;\n	cursor:move;\n}\n#bookmarksBox #topBar .btn{\n	display:block;\n	width:19px;\n	cursor:pointer;\n	color:#20a8b1;\n}\n#bookmarksBox #topBar #bookmarksMin{\n	font-weight:bold;\n	text-align:center;\n	line-height:14px;\n	font-size:18px;\n}\n#bookmarksBox #topBar #bookmarksMin:hover{\n	color:gold;\n}\n#bookmarksBox #bookmarksTypeBar{\n	clear:both;\n}\n#bookmarksBox h5{\n	padding:4px 0;\n	width:114px;\n	text-align:center;\n	color:#788;\n}\n#bookmarksBox h5.current{\n	cursor:default;\n	background:0;\n	color:#fff !important;\n}\n#bookmarksBox h5:hover{\n	color:gold;\n	background:rgba(0,0,0,0);\n}\n#bookmarksBox #topBar .btn, #bookmarksBox .addForm, #bookmarksBox .handle, #bookmarksBox #bookmarksTypeBar, #bookmarksBox .bookmarkList li.bookmarksEmpty, #bookmarksBox .bookmarkList li.bkmrk a, #bookmarksBox .bookmarkList li.bkmrk:hover{\n	background-color:rgba(8,48,78,.85);\n}\n#bookmarksBox h5, #bookmarksBox .bookmarkList li.bkmrk:hover .bookmarksLink, #bookmarksBox .addForm *{\n	background:rgba(0,0,0,.3);\n}\n#bookmarksBox .addForm *{\n	display:block;\n	float:left;\n	padding:4px 8px 3px;\n}\n#bookmarksBox .addForm a{\n	cursor:pointer;\n	color:#20a8b1;\n	font-size:12px;\n	width:65px;\n	text-align:center;\n	line-height:20px;\n	padding:4px 0 3px;\n}\n#bookmarksBox .addForm a:hover{\n	background:gold;\n	color:#000;\n	text-decoration:none;\n}\n#bookmarksBox .addForm input{\n	font-size:11px !important;\n	color:#ffce00;\n	width:81px;\n	line-height:11px;\n	font-size:12px;\n	-webkit-box-sizing:content-box;\n	-moz-box-sizing:content-box;\n	box-sizing:content-box;\n}\n#bookmarksBox #bkmrk_portals .addForm input{\n	width:147px;\n}\n#bookmarksBox .addForm input:hover, #bookmarksBox .addForm input:focus{\n	outline:0;\n	background:rgba(0,0,0,.6);\n}\n#bookmarksBox .bookmarkList>ul{\n	width:231px;\n	clear:both;\n	list-style-type:none;\n	color:#fff;\n	overflow:hidden;\n	max-height:550px;\n}\n#bookmarksBox .sortable-placeholder{\n	background:rgba(8,48,78,.55);\n	box-shadow:inset 1px 0 0 #20a8b1;\n}\n#bookmarksBox .ui-sortable-helper{\n	border-top-width:1px;\n}\n#bookmarksBox .bookmarkList{\n	display:none;\n}\n#bookmarksBox .bookmarkList.current{\n	display:block;\n}\n#bookmarksBox h5, #bookmarksBox .addForm *, #bookmarksBox ul li.bkmrk, #bookmarksBox ul li.bkmrk a{\n	height:22px;\n}\n#bookmarksBox h5, #bookmarksBox ul li.bkmrk a{\n	overflow:hidden;\n	cursor:pointer;\n	float:left;\n}\n#bookmarksBox ul .bookmarksEmpty{\n	text-indent:27px;\n	color:#eee;\n}\n#bookmarksBox ul .bookmarksRemoveFrom{\n	width:19px;\n	text-align:center;\n	color:#fff;\n}\n#bookmarksBox ul .bookmarksLink{\n	width:171px;\n	padding:0 10px 0 8px;\n	color:gold;\n}\n#bookmarksBox ul .bookmarksLink.selected{\n	color:#03fe03;\n}\n#bookmarksBox ul .othersBookmarks .bookmarksLink{\n	width:190px;\n}\n#bookmarksBox ul .bookmarksLink:hover{\n	color:#03fe03;\n}\n#bookmarksBox ul .bookmarksRemoveFrom:hover{\n	color:#fff;\n	background:#e22;\n}\n#bookmarksBox, #bookmarksBox *{\n	border-color:#20a8b1;\n	border-style:solid;\n	border-width:0;\n}\n#bookmarksBox #topBar, #bookmarksBox ul .bookmarkFolder{\n	border-top-width:1px;\n}\n#bookmarksBox #topBar, #bookmarksBox #bookmarksTypeBar, #bookmarksBox .addForm, #bookmarksBox ul .bookmarkFolder .folderLabel, #bookmarksBox ul li.bkmrk{\n	border-bottom-width:1px;\n}\n#bookmarksBox ul .bookmarkFolder, #bookmarksBox ul .bookmarksRemoveFrom{\n	border-right-width:1px;\n	border-left-width:1px;\n}\n#bookmarksBox #topBar *, #bookmarksBox #bookmarksTypeBar *, #bookmarksBox .addForm *{\n	border-left-width:1px;\n}\n#bookmarksBox #topBar, #bookmarksBox #bookmarksTypeBar, #bookmarksBox .addForm{\n	border-right-width:1px;\n}\n#bookmarksBox ul .othersBookmarks .bookmarksRemoveFrom, #bookmarksBox ul .bookmarkFolder .folderLabel .bookmarksRemoveFrom{\n	border-left-width:0;\n}\n#bookmarksShow{\n	display:block;\n	position:absolute;\n	top:0;\n	left:250px;\n	width:47px;\n	margin-top:-36px;\n	height:64px;\n	cursor:pointer;\n	z-index:2999;\n	background-position:center bottom;\n	background-repeat:no-repeat;\n	transition:margin-top 100ms ease-in-out;\n	background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC8AAABABAMAAAB4qzMQAAAAJFBMVEUAru4Aru4Aru4AAADD7Pui4vlpz/UxvfLq+P530/b///8Cru4tHzUkAAAABHRSTlM8j+sAXo1XGQAAAh1JREFUeF5t1LFy2kAQBmCHvIAnLt2QmsYevQIJg9LayMFtokF2C5Nx3AYSVBMZoJUm57+KPQmyZl/OuwuHdIit0H5a/cfp4KhFcbDQCi8+R/oh8f9QU+Bar5MZDIsDa4ZwBiDtuUAR3x9j7CNNXFgnv7mffI3xI3GAuMU3b7gKuX0IB43DEvI+jMaqfAh3MNiERizhFdC10IZZ5QwzoegKJt4CsCK6WyR9fpwKLARElPNipotExLfQ4b6MIOMUkdiGK+QzGO66X1DrBuhp/D70gSn3axM5gGwRhpED36KLmAGmfelMFCgrdSaWJXQdKCoDDpQj3ciFohxwgW7swD78UzDc3oMXBfBWHYZeDb5bSOrhhuFjbaKP9HYITGvgm1uiL3iswieBXyvhgbzd0ELK9+YPpHUZydHaArJ7snUnh9FCVdbSj7cQ+Hi0kPOBnyx3vyi+sBMxprQDKmJ0FPK+BJZAI7BoP+W4ElQCorn0XaAhzMMA/PX3gbgLs6I60BwmoENQIKNDkPvA5BAskcUI6jDglY403YWRrnTI6kKxfcocmQNrX3bkWfdkUgG+nHL/pKG72ylhoG/qxPPeEf0Hri20NbLped7ZqW6aX/3LeM99lpYsHBY4+OmtgncuZ8/ChIOlr9WQzdnAmCTYliyg+KnAwcdlXxdwr6DBVZGWwpPn1nlLQYPdeqPwrMFuNRgkuF6nf4+a3qE6O34F/Pwp4++kiAUAAAAASUVORK5CYII=);\n}\n#bookmarksShow:hover{\n	margin-top:0 !important;\n}\n#sidebar #portaldetails h3.title{\n	width:auto;\n}\n#bookmarkStar{\n	display:inline-block;\n	float:left;\n	margin:3px 1px 0 4px;\n	width:16px;\n	height:15px;\n	overflow:hidden;\n	background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAPBAMAAAB3rtAkAAAAJFBMVEX/zgD/////zgD/////zgD/zgD/////zgD///////8AAAD/zgCqRXscAAAAC3RSTlMZT3QX4z4pqm6MAMdj9VkAAACkSURBVHheTc4hDsJAEIXhEai9AauregAS6jHgMCRFYiiekLS+oZJgWAc0tOUpQkgq5nLwdit48svkzwiALoHfIwdAyGyA9jVAdQ6w7gM07hSgUEOot85tCEvVvYEcHXcpVwvlDpI5PztSv5nUBFYKwicVTAkWaP0BBDcmGGUk/QcdoGODjxNiD+XYJcBd35HmEDxL1NXuB71BNIdgAqAhGOAa4wvjaY4hncG/BwAAAABJRU5ErkJggg==);\n	background-position:left center;\n	background-repeat:no-repeat;\n}\n#bookmarkStar:hover, #bookmarkStar.favorite{\n	background-position:right center;\n}\n#bookmarksBox .handleScroll{\n	cursor:s-resize;\n	width:3px;\n	right:3px;\n	background:gold;\n	opacity:.7;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder{\n	overflow:hidden;\n	margin-top:-1px;\n	height:auto;\n	background:rgba(8,58,78,.7);\n}\n#bookmarksBox .bookmarkList ul li.sortable-placeholder{\n	box-shadow:inset -1px 0 0 #20a8b1, inset 1px 0 0 #20a8b1, 0 -1px 0 #20a8b1;\n	background:rgba(8,58,78,.9);\n}\n#bookmarksBox .bookmarkList .bkmrk.ui-sortable-helper{\n	border-right-width:1px;\n	border-left-width:1px;\n}\n#bookmarksBox .bookmarkList ul li ul li.sortable-placeholder{\n	height:23px;\n	box-shadow:inset 0 -1px 0 #20a8b1, inset 1px 0 0 #20a8b1;\n}\n#bookmarksBox .bookmarkList ul li.bookmarkFolder.ui-sortable-helper, #bookmarksBox .bookmarkList ul li.othersBookmarks ul, #bookmarksBox .bookmarkList ul li.othersBookmarks ul li.sortable-placeholder{\n	box-shadow:inset 0 -1px 0 #20a8b1;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel .bookmarksAnchor span, #bookmarksBox .bookmarkList .bookmarkFolder .folderLabel>span, #bookmarksBox .bookmarkList .bookmarkFolder .folderLabel>span>span, #bookmarksBox .bookmarkList .triangle{\n	width:0;\n	height:0;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel{\n	overflow:visible;\n	height:25px;\n	cursor:pointer;\n	background:#069;\n	text-indent:0;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel>*{\n	height:25px;\n	float:left;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel .bookmarksAnchor{\n	line-height:25px;\n	color:#fff;\n	width:209px;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel .bookmarksAnchor span{\n	float:left;\n	border-width:5px 0 5px 7px;\n	border-color:transparent transparent transparent white;\n	margin:7px 7px 0 6px;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder.active .folderLabel .bookmarksAnchor span{\n	margin:9px 5px 0 5px;\n	border-width:7px 5px 0 5px;\n	border-color:white transparent transparent transparent;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel>span, #bookmarksBox .bookmarkList .bookmarkFolder .folderLabel>span>span{\n	display:none;\n	border-width:0 12px 10px 0;\n	border-color:transparent #20a8b1 transparent transparent;\n	margin:-20px 0 0;\n	position:relative;\n	top:21px;\n	left:219px;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel>span>span{\n	top:18px;\n	left:0;\n	border-width:0 10px 9px 0;\n	border-color:transparent #069 transparent transparent;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder.active .folderLabel>span, #bookmarksBox .bookmarkList .bookmarkFolder.active .folderLabel>span>span{\n	display:block;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder.active .folderLabel:hover>span>span{\n	border-color:transparent #036 transparent transparent;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder .folderLabel:hover .bookmarksAnchor{\n	background:#036;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder ul{\n	display:none;\n	margin-left:19px;\n}\n#bookmarksBox .bookmarkList .bookmarkFolder.active ul{\n	display:block;\n	min-height:22px;\n}\n#bookmarksBox .bookmarkFolder.othersBookmarks ul{\n	margin-left:0;\n}\n)\n').appendTo('head');
	}

	//---------------------------------------------------------------------------------------
	// Append the stylesheet for mobile app
	//---------------------------------------------------------------------------------------
	window.plugin.bookmarks.setupCSS_mobile = function(){
		$('<style>').prop('type', 'text/css').html('#sidebar #bookmarksBox{\n	position:static !important;\n	width:auto !important;\n	margin:0 !important;\n	width:100%;\n}\n#sidebar #bookmarksBox .bookmarkList > ul > li, #sidebar #bookmarksBox .bookmarkList > ul > li > ul, #sidebar #bookmarksBox .bookmarkList > ul > li > ul > li{\n	width:100% !important;\n}\n#sidebar #bookmarksBox *{\n	box-shadow:none !important;\n	border-width:0 !important\n}\n#sidebar #bookmarksBox #topBar{\n	display:none !important;\n}\n#sidebar #bookmarksBox #bookmarksTypeBar h5{\n	cursor:pointer;\n	text-align:center;\n	float:left;\n	width:50%;\n	padding:7px 0;\n}\n#sidebar #bookmarksBox #bookmarksTypeBar h5.current{\n	cursor:default;\n	color:#fff;\n}\n#sidebar #bookmarksBox #bookmarksTypeBar, #sidebar #bookmarksBox .bookmarkList .addForm{\n	border-bottom:1px solid #20a8b1 !important;\n}\n#sidebar #bookmarksBox .bookmarkList ul li ul li.bkmrk{\n	height:36px !important;\n	clear:both;\n}\n#sidebar #bookmarksBox .bookmarkList li.bookmarkFolder .folderLabel{\n	height:36px;\n}\n#sidebar #bookmarksBox .bookmarkList li.bookmarkFolder .folderLabel a, #sidebar #bookmarksBox .bookmarkList ul li ul li.bkmrk a{\n	background:none;\n	padding:7px 0;\n	height:auto;\n	box-shadow:inset 0 1px 0 #20a8b1 !important;\n}\n#sidebar #bookmarksBox .bookmarkList li.bookmarkFolder a.bookmarksRemoveFrom, #sidebar #bookmarksBox .bookmarkList li.bkmrk a.bookmarksRemoveFrom{\n	box-shadow:inset 0 1px 0 #20a8b1, inset -1px 0 0 #20a8b1 !important;\n	width:15%;\n}\n#sidebar #bookmarksBox .bookmarkList li.bookmarkFolder a.bookmarksAnchor, #sidebar #bookmarksBox .bookmarkList li.bkmrk a.bookmarksLink{\n	text-indent:10px;\n	width:85%;\n	height:21px /*22*/;\n	overflow:hidden;\n}\n#sidebar #bookmarksBox .bookmarkList ul li.bookmarkFolder ul{\n	margin-left:0 !important;\n}\n#sidebar #bookmarksBox .bookmarkList ul, #bookmarksBox .bookmarkList ul li, #sidebar #bookmarksBox .bookmarkList ul li ul, #sidebar #bookmarksBox .bookmarkList ul li ul li{\n	display:block !important;\n}\n#sidebar #bookmarksBox .bookmarkList{\n	display:none !important;\n}\n#sidebar #bookmarksBox .bookmarkList > ul{\n	border-bottom:1px solid #20a8b1 !important;\n	border-right:1px solid #20a8b1 !important;\n}\n#sidebar #bookmarksBox .bookmarkList.current{\n	display:block !important;\n}\n#sidebar #bookmarksBox .bookmarkList .bookmarkFolder.othersBookmarks ul{\n	border-top:5px solid #20a8b1 !important;\n}\n#sidebar #bookmarksBox .bookmarkList li.bookmarkFolder, #sidebar #bookmarksBox .bookmarkList li.bkmrk{\n	box-shadow:inset 0 1px 0 #20a8b1, 1px 0 0 #20a8b1, -1px 1px 0 #20a8b1 !important;\n}\n#sidebar #bookmarksBox .bookmarkList li.bookmarkFolder .bkmrk.sortable-placeholder{\n	height:36px !important;\n}\n#sidebar #bookmarksBox .bookmarkList .sortable-placeholder{\n	box-shadow:inset 0 1px 0 #20a8b1 !important;\n}\n#sidebar #bookmarksBox .ui-sortable .ui-sortable-helper{\n	border-top:0;\n	width:85% !important;\n}\n#sidebar #bookmarksBox .bookmarkList > ul{\n	max-height:none;\n	width:85% !important;\n}\n#sidebar #bookmarksBox .bookmarkList li.bookmarkFolder .folderLabel{\n	box-shadow:0 1px 0 #20a8b1 !important;\n}\n#sidebar #bookmarksBox .bookmarkList ul li.bookmarkFolder ul{\n	width:85% !important;\n	margin-left:15% !important;\n}\n#sidebar #bookmarksBox .bookmarkList ul li.bookmarkFolder.othersBookmarks ul{\n	width:100% !important;\n	margin-left:0% !important;\n}\n#sidebar #bookmarksShowMobile{\n	text-decoration:none;\n	display:block !important;\n	padding:11px 0 9px;\n	text-align:center;\n}\n#sidebar #portaldetails{\n	margin-top:25px;\n}\n#sidebar #bookmarksBox #bookmarksTypeBar{\n	height:auto;\n}\n#sidebar #bookmarksBox .addForm, #sidebar #bookmarksBox .addForm *{\n	height:35px;\n	padding:0;\n}\n#sidebar #bookmarksBox .addForm a{\n	line-height:37px;\n}\n#sidebar #bookmarksBox .addForm a{\n	width:25% !important;\n}\n#sidebar #bookmarksBox .addForm input{\n	width:50% !important;\n	text-indent:10px;\n}\n#sidebar #bookmarksBox #bkmrk_portals .addForm input{\n	width:75% !important;\n}\n#sidebar #bookmarksBox #bookmarksTypeBar h5, #sidebar #bookmarksBox .bookmarkList .addForm a{\n	box-shadow:-1px 0 0 #20a8b1 !important;\n}\n#sidebar #bookmarksBox .bookmarkList li.bookmarkFolder ul{\n	display:block !important;\n	min-height:37px !important;\n}').appendTo('head');
	}

	//---------------------------------------------------------------------------------------
	// Append the js script
	//---------------------------------------------------------------------------------------
	window.plugin.bookmarks.setupJS = function(){$(document).ready(function(){
		//ENABLED THE DRAGGABLE PROPERTY OF THE BOX
		$('#bookmarksBox').draggable({ handle:'.handle', containment:'window' });
		$("#bookmarksBox #bookmarksMin , #bookmarksBox ul li, #bookmarksBox ul li a, #bookmarksBox h5, #bookmarksBox .addForm a").disableSelection();

		//SWICTH VISIBILITY PROPERTY OF THE BOX
		$('#bookmarksMin').click(function(){
			$('#bookmarksBox').animate({marginTop:'-200%'}, {duration:600, queue:false}); $('#bookmarksShow').animate({marginTop:-36}, {duration:400, queue:false}); localStorage[window.plugin.bookmarks['LOCAL_STORAGE_status_box']] = 0;
		});
		$('#bookmarksShow').click(function(){ $('#bookmarksBox').animate({marginTop:0}, {duration:600, queue:false}); $('#bookmarksShow').animate({marginTop:-100}, {duration:400, queue:false}); localStorage[window.plugin.bookmarks['LOCAL_STORAGE_status_box']]= 1; });
		if(localStorage[window.plugin.bookmarks['LOCAL_STORAGE_status_box']] == 1){ $('#bookmarksShow').trigger('click'); }else{ $('#bookmarksMin').trigger('click'); }

		//SWITCH LIST (MAPS/PORTALS)
		$('#bookmarksBox h5').click(function(){
			$('h5').removeClass('current');
			$(this).addClass('current');
			var sectList = '#'+$(this).attr('class').replace(' current', '');
			$('#bookmarksBox .bookmarkList').removeClass('current');
			$(sectList).addClass('current');
		});

		if(!window.isSmartphone()){
			//DESTOP: active vertical scroll-bar on the long lists
			$('.bookmarkList > ul').enscroll({ showOnHover: true, verticalTrackClass: 'trackScroll', verticalHandleClass: 'handleScroll', minScrollbarLength:28 });

			//OPEN/CLOSE FOLDER (to be corrected in mobile mode)---------------
			$('#bookmarksBox').on('click', '.bookmarksAnchor', function(e){
				window.plugin.bookmarks.openFolder(this);
				$(this).parent().parent('li').toggleClass('active');
				e.preventDefault();
			});
		}

		//ENABLED THE SORTABLE PROPERTY OF THE FOLDERS AND BOOKMARKS
		$(".bookmarkList > ul").sortable({
			items:"li.bookmarkFolder:not(.othersBookmarks)",
			handle:".bookmarksAnchor",
			placeholder:"sortable-placeholder",
			forcePlaceholderSize:true,
			helper:'clone',
			distance:5,
			update:function(event, ui){
				var typeList = $('#'+ui.item.context.id).parent().parent('.bookmarkList').attr('id');
				window.plugin.bookmarks.sortBookmarksFolder(typeList);
			}
		});
		$(".bookmarkList ul li ul").sortable({
			items:"li.bkmrk",
			connectWith:".bookmarkList ul ul",
			handle:".bookmarksLink",
			placeholder:"sortable-placeholder",
			forcePlaceholderSize:true,
			helper:'clone',
			distance:5,
			update:function(event, ui){
				var typeList = $('#'+ui.item.context.id).parent().parent().parent().parent('.bookmarkList').attr('id');
				window.plugin.bookmarks.sortBookmarks(typeList);
			}
		});

		//ADD BOOKMARK/FOLDER
		$('#bookmarksBox .addForm a').click(function(e){
			var typeList = $(this).parent().parent('div').attr('id');
			if($(this).hasClass('newMap')){ window.plugin.bookmarks.addBookmarkMap(this); }
			else{ window.plugin.bookmarks.addFolder(typeList); }

			//REFRESS SORTABLE EVENT FOR BKMRK
			$(".bookmarkList ul li ul").sortable({
				items:"li.bkmrk",
				connectWith:".bookmarkList ul ul",
				handle:".bookmarksLink",
				placeholder:"sortable-placeholder",
				forcePlaceholderSize:true,
				helper:'clone',
				distance:5,
				update:function(event, ui){
					var typeList = $('#'+ui.item.context.id).parent().parent().parent().parent('.bookmarkList').attr('id');
					window.plugin.bookmarks.sortBookmarks(typeList);
				}
			});
			if(window.isSmartphone()){
				// The clone not working in mobile mode (to be corrected)---------------
				$(".bookmarkList ul li ul").sortable("option", "helper", "original");
			};
			e.preventDefault();
		});

		//REMOVE FOLDER
		$('.bookmarkList').on('click', '.folderLabel .bookmarksRemoveFrom', function(e){
			window.plugin.bookmarks.deletFolder(this);
			$(this).parent().parent('li').remove();
			e.preventDefault();
		});

		//REMOVE BOOKMARK
		$('.bookmarkList').on('click', '.bkmrk .bookmarksRemoveFrom', function(e){
			window.plugin.bookmarks.deletBookmark(this);
			$(this).parent('li').remove();
			e.preventDefault();
		});

		if(window.isSmartphone()){
			//FOR MOBILE
			// The clone not working in mobile mode (to be corrected)---------------
			$(".bookmarkList > ul").sortable("option", "helper", "original");
			$(".bookmarkList ul li ul").sortable("option", "helper", "original");

			//Show/Hide the box
			$('#bookmarksBox').hide();
			$('#bookmarksShowMobile').click(function(){
			$(this).toggleClass('open');
				$('#bookmarksBox').toggle();
				if($(this).hasClass('open')){ $(this).text('[-] Bookmarks'); }
				else{ $(this).text('[+] Bookmarks'); }
			});

			//Return to map when a bookmark is clicked
			$('.bookmarkList').on('click', '.bkmrk .bookmarksLink', function(){
				window.show("map");
			});
		}
	});}

	//---------------------------------------------------------------------------------------
	// HTML element
	//---------------------------------------------------------------------------------------
	window.plugin.bookmarks.setupContent = function(){
		plugin.bookmarks.contentStarHTML	= 	'<a id="bookmarkStar" onclick="window.plugin.bookmarks.switchStarPortal();return false;" title="Save this portal in your bookmarks"><span></span></a>';
		plugin.bookmarks.disabledMessage	=	'<div title="Your browser do not support localStorage">Plugin Bookmarks disabled</div>';
		plugin.bookmarks.bkmrkRibbon		=	'<a id="bookmarksShow"></a>';
		plugin.bookmarks.bkmrkBox			=	'<div id="bookmarksBox">'
													+'<div id="topBar"><a id="bookmarksMin" class="btn" title="Minimize">-</a><div class="handle">...</div></div>'
													+'<div id="bookmarksTypeBar"><h5 class="bkmrk_maps current">Maps</h5><h5 class="bkmrk_portals">Portals</h5><div style="clear:both !important;"></div></div>'
													+'<div id="bkmrk_maps" class="bookmarkList current"><div class="addForm"><input placeholder="Insert label"><a class="newMap" onmouseover="setPermaLink(this);return false">+ Map</a><a class="newFolder">+ Folder</a></div><ul></ul></div>'
													+'<div id="bkmrk_portals" class="bookmarkList"><div class="addForm"><input placeholder="Insert label"><a class="newFolder">+ Folder</a></div><ul></ul></div>'
												+'</div>';
		plugin.bookmarks.bkmrkTriggerMobile=	'<a id="bookmarksShowMobile">[+] Bookmarks</a>';
	}

/***************************************************************************************************************************************************************/

	var setup =  function(){
		//Set the localStorage (if not exist)
		if(!localStorage[window.plugin.bookmarks['LOCAL_STORAGE_bkmrk_portals']]){localStorage[plugin.bookmarks['LOCAL_STORAGE_bkmrk_portals']] = '{"bkmrk_portals":{"'+window.plugin.bookmarks.KEY_OTHER_BKMRK+'":{"label":"Others","state":1,"bkmrk":{}}}}'; }
		if(!localStorage[window.plugin.bookmarks['LOCAL_STORAGE_bkmrk_maps']]){localStorage[plugin.bookmarks['LOCAL_STORAGE_bkmrk_maps']] = '{"bkmrk_maps":{"'+window.plugin.bookmarks.KEY_OTHER_BKMRK+'":{"label":"Others","state":1,"bkmrk":{}}}}'; }
		if(!localStorage[window.plugin.bookmarks['LOCAL_STORAGE_status_box']]){localStorage[plugin.bookmarks['LOCAL_STORAGE_status_box']] = 1;}

		//Load data from localStorage
		window.plugin.bookmarks.loadBookmarks('bkmrk_portals');
		window.plugin.bookmarks.loadBookmarks('bkmrk_maps');

		if(window.isSmartphone()){
			//FOR MOBILE: load the script for the touch events
			var script2 = document.createElement('script');
			script2.type = 'text/javascript';
			script2.src = 'https://raw.github.com/furf/jquery-ui-touch-punch/master/jquery.ui.touch-punch.min.js';
			script2.appendChild(document.createTextNode('('+ wrapper +')();'));
			(document.body || document.head || document.documentElement).appendChild(script2);
		}else{
			//FOR DESKTOP: load the script to active the vertical scrollbar (in the bookmarks box)
			var script3 = document.createElement('script');
			script3.type = 'text/javascript';
			script3.src = 'http://enscrollplugin.com/releases/enscroll-0.4.0.min.js';
			script3.appendChild(document.createTextNode('('+ wrapper +')();'));
			(document.body || document.head || document.documentElement).appendChild(script3);
		}

		if($.inArray('pluginBookmarksUpdate', window.VALID_HOOKS) < 0){ window.VALID_HOOKS.push('pluginBookmarksUpdate'); }

		window.plugin.bookmarks.setupCSS();
		if(window.isSmartphone()){window.plugin.bookmarks.setupCSS_mobile();}
		window.plugin.bookmarks.setupContent();

		//Append the bookmarks box
		if(!window.isSmartphone()){ $('body').append(plugin.bookmarks.bkmrkRibbon+plugin.bookmarks.bkmrkBox); }
		else{ $('#portaldetails').before(plugin.bookmarks.bkmrkTriggerMobile+plugin.bookmarks.bkmrkBox); }

		//Load bookmarks and folders in the box
		window.plugin.bookmarks.loadList('bkmrk_maps');
		window.plugin.bookmarks.loadList('bkmrk_portals');

		window.plugin.bookmarks.setupJS();
		window.addHook('portalDetailsUpdated', window.plugin.bookmarks.addToSidebar);
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


