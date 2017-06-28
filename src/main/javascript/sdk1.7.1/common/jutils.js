/*
 * ============================================================================================================
 *    				                            logging (old defunc)
 * ============================================================================================================
 */

/*
 * NAME
 *	log todo remove this object
 *
 * SYNOPSIS
 *	log( content )
 *
 * DESCRIPTION
 *	This is an available debugging function that updates an HTML
 *	DOM element with an ID of 'log'.  It is useful during developing
 *	and debugging pages that contain JavaScript to trace the flow of
 *	the code.
 *
 * EXAMPLE
 *	Manually add a DIV <div id='log' style='location...> This specifies where
 *	on the Luxe's display to show the debugging information.
 *	Then call ..
 *
 */
var logs = {
    log: function (content) {
        var log = document.getElementById('log');
        this.logHTML(log, content);
    },
    ID1: function (content) {
        var log = document.getElementById('ID1');
        this.logHTML(log, content);
    },
    logHTML: function (log, content) {
        if (!log) {
            return;
        }
        return log.innerHTML += ('<pre>' + content + '');
    }
};

/*
 * ============================================================================================================
 *    								   	           app configs
 * ============================================================================================================
 */

function goToHomeApp() {
    var homeApp;
    getAppConfigs().then(function (apps) {
        if (apps) {
            for (var i = 0; i < apps.length; i++) {
                if (apps[i].homePage) {
                    homeApp = apps[i];
                    break;
                }
            }
        }
        if (homeApp && homeApp.homePage) {
            var page = homeApp.homePage;
            if (page.indexOf('html/') === 0) {
                page = page.replace('html/', '');
                page = homeApp.appName + '/' + page;
            }
            pageShow(page);
        } else {
            logger.error("goToHomeApp: Unable to find defualt application home page /home/{}/app.conf:", homeApp)
        }
    });
}

function getAppConfigs() {
    var deferred = $.Deferred();
    var apps = [];
    $.ajax({
        type: "GET",
        url: '/cgi-bin/file/dir',
        contentType: "text/xml",
        dataType: "xml",
        error: function (request, error) {
            console.error(error);
            deferred.reject();
        },
        success: function (xml, status, xhr) {
            var requests = [];
            var appNames = [];
            var xml = $.parseXML(xhr.responseText);
            var dNodes = xml.getElementsByTagName('d');
            for (var i = 0; i < dNodes.length; i++) {
                var appName = dNodes[i].childNodes[0].nodeValue;
                requests.push($.ajax({
                    type: "GET",
                    url: '/cgi-bin/file/get?path=' + appName + '/app.conf',
                    contentType: "text/xml",
                    dataType: "xml",
                }));
                appNames.push(appName);
            }
            if (requests.length > 0) {
                $.when.apply($, requests).then(function () {
                    for (var i = 0; i < arguments.length; i++) {
                        var appName = appNames[i];
                        var xml = $.parseXML(arguments[i][2].responseText);
                        var desktopItem = $(xml).find('desktop_item');
                        var homeButton = $(xml).find('home_button');
                        var configPage = $(xml).find('config_page');
                        apps.push({
                            appName: appName,
                            title: desktopItem.length ? desktopItem.attr('title') : undefined,
                            icon: desktopItem.length && desktopItem.attr('icon_path') ? desktopItem.attr('icon_path') : undefined,
                            iconPosition: desktopItem.length && desktopItem.attr('icon_position') ? desktopItem.attr('icon_position') : -1,
                            page: desktopItem.length && desktopItem.text() ? desktopItem.text() : undefined,
                            setupPage: configPage.length && configPage.text() ? configPage.text() : undefined,
                            homePage: homeButton.length && homeButton.text() ? homeButton.text() : undefined
                        });

                    }
                    apps.sort(function (a, b) {
                        return a.title > b.title;
                    });
                    apps.sort(function (a, b) {
                        return b.iconPosition - a.iconPosition;
                    });
                    deferred.resolve(apps);
                }).fail(function (xhr, status, error) {
                    console.error(error);
                    deferred.reject();
                });
            }
        }
    });
    return deferred.promise();
}

/*
 * ============================================================================================================
 *    				               todo helper functions, review for deletion
 * ============================================================================================================
 */

/*
 * NAME
 *	getAmount
 *
 * SYNOPSIS
 *  getAmount( varName );
 *	Where:-
 * 		@param {string} varName - name of the number variable
 * 		@return {number} amountVal - formatted amount value.
 *
 * DESCRIPTION
 *	This function retrieves a variable that is exptected to be a simple
 *  numeric string with 2 implied decimals places( "000000001299" ) and
 *  change the format to zero supressed with 2 decimal places "12.99"
 *
 * EXAMPLE
 *
 */
function getAmount(varName) {
    var amountVal;

    if (isTerminal()) {
        amountVal = registry.getValue(varName);
        logger.info("getAmount: varName={}, value={}", varName, amountVal);
    } else {
        $.ajax({
            type: "GET",
            url: jPhoenixSettings.getBaseUrl() + 'variable/get',
            data: varName,
            dataType: "xml",
            async: false,
            success: function (response) {
                var variable = response.getElementsByTagName("variable");
                for (i = 0; i < variable.length; i++) {
                    if (variable[i].innerHTML == "" || variable[i].innerHTML == "false") {
                        amountVal = false;
                    } else {
                        amountVal = variable[i].textContent;
                    }
                }
            }
        })
    }
    if (amountVal) {
        var valLength = amountVal.length;
        var amount = amountVal.substring(0, valLength - 2) + "." + amountVal.substring(valLength - 2);
        amountVal = amount.replace(/^[0]+/g, "");
    }
    return amountVal;
}

/*
 * NAME
 *	consoleLog todo remove this (testing purposes)
 *
 * SYNOPSIS
 *  consoleLog( message );
 *	Where:-
 * 		@param {string} message - message to be logged in console/log file.
 *
 * DESCRIPTION
 *	This function send log entry to be wrriten in log file
 *
 * EXAMPLE
 *
 */
function consoleLog(message) {
    $.get('/cgi-bin/sdk/console/log', {message: message});
}

/*
 * NAME
 *	htmlEscape
 *
 * SYNOPSIS
 *  htmlEscape( str );
 *	Where:-
 * 		@param {string} str - string to be replaces
 * 	 	@return {string} formatted String
 *
 * DESCRIPTION
 *	This function replaces the special characters with preferred symbols.
 *
 * EXAMPLE
 *
 */
function htmlEscape(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/*
 * NAME
 *	updateScroll
 *
 * SYNOPSIS
 *  updateScroll( id );
 *	Where:-
 * 		@param {string} id - DOM id for update the scroll.
 *
 * DESCRIPTION
 *	This function scrolls an item up after adding a new items to the end of a list
 *
 * EXAMPLE
 *
 */
function updateScroll(id) {
    var objDiv = document.getElementById(id);
    objDiv.style.overflow = "hidden";
    objDiv.scrollTop = objDiv.scrollHeight;
}

/*
 * NAME
 *	determineTypeOfValue
 *
 * SYNOPSIS
 *  determineTypeOfValue( value );
 *	Where:-
 * 		@param {*(string, number, blob)} value - could be string, number or binary large object (blob)
 * 		@return {*(string, number, blob)} type - could be any of the type
 *
 * DESCRIPTION
 *	This functions determines the type of the value to set the variable name.
 *
 * EXAMPLE
 *
 */
function determineTypeOfValue(value) {
    var type;
    if (typeof value === "number") {
        type = 'integer';
    } else if (typeof value === 'string') {
        type = 'string';
    } else {
        type = 'blob';
    }
    return type;
}

/*
 * NAME
 *	Uint8ArrayToString
 *
 * SYNOPSIS
 *  Uint8ArrayToString( buf );
 *	Where:-
 * 		@param {array} buf - an array of values
 * 		@return {string} converted string
 *
 * DESCRIPTION
 *	This function converts Uint8Array to String
 *
 * EXAMPLE
 *  var buf = [110,123,141,152,187];
 */
function Uint8ArrayToString(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

/*
 * NAME
 *	stringToUint8Array
 *
 * SYNOPSIS
 *  stringToUint8Array( str );
 *	Where:-
 * 		@param {string} str - text string
 * 		@return {arrayBuffer} buffer with array
 *
 * DESCRIPTION
 *	This function converts String to Uint8Array
 *
 * EXAMPLE
 *  var str = "hello";
 */
function stringToUint8Array(str) {
    var buf = new Array(str.length);
    var bufView = new Uint8Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return bufView;
}

/*
 * NAME
 *	stringToHexaDecimalASCII
 *
 * SYNOPSIS
 *  stringToHexaDecimalASCII( str );
 *	Where:-
 * 		@param {string} str - text String
 * 		@return {string} HexaDecimal ASCII String
 *
 * DESCRIPTION
 *	This function converts String to HexaDecimalASCII String
 *
 * EXAMPLE
 *  var str = "\x01\x02\x03";
 */
function stringToHexaDecimalASCII(str) {
    var hex, i;
    var result = "";
    for (i = 0; i < str.length; i++) {
        hex = str.charCodeAt(i).toString(16);
        result += ("000" + hex).slice(-4);
    }
    return result
}

/*
 * NAME
 *	hexaDecimalASCIIToString
 *
 * SYNOPSIS
 *  hexaDecimalASCIIToString( hex );
 *	Where:-
 * 		@param {string} hex - HexaDecimal String
 * 		@return {string} text String
 *
 * DESCRIPTION
 *	This function converts HexaDecimalASCII String to String
 *
 * EXAMPLE
 *  var hex = "010203";
 */
function hexaDecimalASCIIToString(hex) {
    var j;
    var hexes = hex.match(/.{1,4}/g) || [];
    var string = "";
    for (j = 0; j < hexes.length; j++) {
        string += String.fromCharCode(parseInt(hexes[j], 16));
    }
    return string;
}

/*
 * NAME
 *	rgbToHex
 *
 * SYNOPSIS
 *  rgbStringToInt( rgbColor );
 *	Where:-
 * 		@param {string} rgbColor - RGB string (example "rgb(255, 62, 109)")
 * 		@return {integer} integer
 *
 * DESCRIPTION
 *	This function converts rgb string to integer value
 *
 * EXAMPLE
 *  rgbStringToInt("rgb(255, 62, 109)") = 16727661;  //16727661=0xFF3E6D
 */
function rgbStringToInt(rgbColor) {
    var rgb = rgbColor.split( ',' ) ;
    var r=parseInt( rgb[0].substring(4) ) ; // skip rgb(
    var g=parseInt( rgb[1] ) ; // this is just g
    var b=parseInt( rgb[2] ) ; // parseInt scraps trailing )

    return r << 16 | g << 8 | b;
}

/*
 * NAME
 *	rgbToHex
 *
 * SYNOPSIS
 *  intToRgbString( intColor );
 *	Where:-
 * 		@param {string} intColor - (example 16727661)
 * 		@return {integer} integer
 *
 * DESCRIPTION
 *	This function converts integer value to rgb string
 *
 * EXAMPLE
 *  intToRgbString(16727661) = "rgb(255, 62, 109)"
 */
function intToRgbString(intColor) {
    var b = intColor & 0xff;
    intColor = intColor >> 8;
    var g = intColor & 0xff;
    intColor = intColor >> 8;
    var r = intColor & 0xff;
    return "rgb(" + r + ", " + g + ", " + b + ")";
}