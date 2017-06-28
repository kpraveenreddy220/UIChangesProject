/*!
 * jphoenix JavaScript Library
 * ===========================
 *
 * Version 0.21	2017-04-13
 *
 * This file is part of the Luxe platform software and should be loaded
 * to directory /var/run/www/common/
 *
 * Steve's comments.  All of the functions in this library should have
 * a comments section at the start of the function that follows the Linux
 * man-page style of documentation.
 *
 * Generally, all man pages should follow a standard layout to ensure
 * readability and compatibility.
 *
 *
 * NAME
 *	The name of the function
 *
 * SYNOPSIS
 *	One line synopsis with list of calling parameters
 *
 * DESCRIPTION
 *	A detailed drecription of the purpose and usage of
 *	the function.
 *
 * OPTIONS
 *	Describe the options if applicable.
 *
 * EXAMPLES
 *	Examples are always nice to have.
 *
 * SEE ALSO
 *	A list of related commands or functions.
 *
 *
 * EXIT STATUS / RETURNS
 *	Define the normal and exception return values.
 *
 * ENVIRONMENT
 *	Optional
 *
 * FILES
 *	optional
 *
 * For a description of the end user documentation for the jphoenix.js
 * functions, please see the document
 *	"Luxe SDK Application Programmers Guide" Chapter 4 - jphoenix Library.
 *
 *
 * NOTES: Many of the jphoenix functions were originally written as simple
 * wrappers around the HTTP API calls.  However, as the JavaScript code is
 * executing on the Luxe terminal, rather than send all requests to the
 * low level functions that process the requests through the web server, a
 * faster execution path is simply to call the low level functions directly.
 * Hence, you will see calls to secure.xxx when calling the promptxxx functions
 * For instance, the promptClear() function in this library used to make an
 * HTTP request to http://127.0.0.1/cgi-bin/prompt/clear (which in turn
 * calls secure.clear) but now it directly calls prompt.clear
 */

// ----------------------------settings------------------------------
var checkIPAddress = window.location.host;

var jPhoenixSettings = {

    /**
     * variables
     */

    HTTP_PROTOCOL: 'http',
    DEVICE_IP: window.location.host,

    /**
     * functions
     */

    getBaseUrl: function () {
        var ip = this.DEVICE_IP;
        if (isTerminal()) {
            ip = 'localhost';
        }
        return jPhoenixSettings.HTTP_PROTOCOL + '://' + ip + '/cgi-bin/';
    }
};

/**
 *  returns true if script is executed on terminal, false otherwise
 *
 * Steve's note.  This was only really useful while developing jphoenix.
 *
 * As the jphoenix library is a set of functions that are only executed
 * on the Luxe terminals browser, none of the jphoenix functions need to
 * worry about running on a PC's browser any more.
 *
 * On second thoughts, it may be useful to keep and enhance the idea of
 * running the functions within a PC's browser as PC browsers have good
 * web developer tools usually built in to the browser.
 */
function isTerminal() {
    if (typeof nfc === 'undefined'
        || typeof printer === 'undefined'
        || typeof p2pe === 'undefined'
        || typeof scr === 'undefined'
        || typeof page === 'undefined'
        || typeof utils === 'undefined'
        || typeof registry === 'undefined'
        || typeof secure === 'undefined'
        || typeof installer === 'undefined'
        || typeof camera === 'undefined') {
        return false;
    }
    return true;
}

/*
 * ============================================================================================================
 *    				                            logging
 * ============================================================================================================
 */

/*
 * NAME
 *	logger
 *
 * SYNOPSIS
 *  logger.error( msg );
 *  logger.warn( msg );
 *  logger.info( msg );
 *  logger.debug( msg );
 *	Where:-
 * 		@param {string} msg - log entry to be send to log file
 *
 * DESCRIPTION
 *	This object contains function that send log entries with appropriate log level to log file.
 *
 * EXAMPLE
 *  logger.error('error with statusCode={} occurs in function={}', statusCode, functionName);
 */
var logger = {
    component: 'jphoenix',
    error: function () {
        logger._toLog(Array.prototype.slice.call(arguments), 'error')
    },
    warn: function () {
        logger._toLog(Array.prototype.slice.call(arguments), 'warn')
    },
    info: function () {
        logger._toLog(Array.prototype.slice.call(arguments), 'info')
    },
    debug: function () {
        logger._toLog(Array.prototype.slice.call(arguments), 'debug')
    },
    _toLog: function (args, level) {
        var msg = logger._format(args[0], args.slice(1, args.length));
        log[level]("[" + logger.component + "] [" + level.toUpperCase() + "] " + msg);

    },
    _format: function (source, params) {
        var i = 0;
        var output = source.replace(/\{}/g, function () {
            var substArray = params.slice(i, ++i);
            var subst = substArray && substArray.length ? substArray[0] : undefined;
            if (subst instanceof Object) {
                subst = JSON.stringify(subst);
            }
            if(subst && subst.length > 512) {	//limit length
               subst = subst.substr(0, 512) + "...";
            }
            return (subst);
        });
        return (output);
    }
}

/*
 * ============================================================================================================
 *    								   	 jphoenix prompt functions
 * ============================================================================================================
 */

/*
 * NAME
 *	promptMSR
 *
 * SYNOPSIS
 *	promptMSR( callBackHandler );
 *	Where:-
 *	 	@param {function} callBackHandler - optional callback function
 *
 * DESCRIPTION
 *  This function prompts MSR track data
 *
 * EXAMPLE
 *
 */
function promptMSR(callBackHandler) {
    logger.debug('promptMSR');
    if (isTerminal()) {
        var statusCode = secure.promptMSR();
        if (statusCode != 0) {
            logger.error('promptMSR: statusCode={}', statusCode);
        }
        if (callBackHandler) {
            callBackHandler(statusCode);
        }
    }
    else {
        $.ajax({
            url: jPhoenixSettings.getBaseUrl() + 'prompt/msr',
            contentType: 'text/xml',
            data: "<promptMSR></promptMSR>",
            dataType: 'text',
            async: false,
            success: function (response) {
                if (callBackHandler) {
                    callBackHandler(response);
                }
            }
        });
    }
}

/*
 * NAME
 *	promptClear
 *
 * SYNOPSIS
 *	promptClear( callBackHandler );
 *	Where:-
 *	 	@param {function} callBackHandler - optional callback function
 *
 * DESCRIPTION
 *  This function removes (deactivates) all previously enabled touch input areas.
 * 	The touch screen and numeric keypad are disabled.
 *
 * EXAMPLE
 *
 */
function promptClear(callBackHandler) {
    //
    // For now, just set aync to false to ensure that the prompt clear
    // is completed before sending the buttons.
    // I should update this to look at the response from clear
    //		if(checkIPAddress==="localhost" && checkIPAddress!=undefined){
    logger.debug('promptClear');
    if (isTerminal()) {
        var statusCode = secure.promptClear();
        if (statusCode != 0) {
            logger.error('promptClear: statusCode={}', statusCode);
        }
        if (callBackHandler) {
            callBackHandler(statusCode);
        }
    } else {
        $.ajax({
            url: jPhoenixSettings.getBaseUrl() + 'prompt/clear',
            async: false,
            success: function (response) {
                if (callBackHandler) {
                    callBackHandler(response);
                }
            },
            dataType: 'text'
        });
    }
}

/*
 * NAME
 *	promptTouchArea
 *
 * SYNOPSIS
 *	promptTouchArea( name, returnText, x, y, width, height, onTouchImg );
 *	Where:-
 *	 	@param {string} name - name of the touch area
 * 		@param {string} onTouchImg - resourceName of the image on touch area touched  is optional
 *		@param {number} x - x co-ordinate
 *		@param {number} y - y co-ordinate
 * 		@param {number} width - width size of the touch area
 * 		@param {number} height - height of the touch area
 * 		@param {string} returnText - text to be return to caller when touch area is touched
 *
 * DESCRIPTION
 *  This function enables a touch input area on the screen.
 *
 * EXAMPLE
 *	promptTouchArea( 'userResponse','', 10, 390, 180, 77, 'ok');
 */
function promptTouchArea(name, onTouchImg, x, y, width, height, returnText) {
    logger.debug('promptTouchArea: name={}, onTouchImg={}, x={}, y={}, width={}, height={}, returnText={}', name, onTouchImg, x, y, width, height, returnText);
    if (isTerminal()) {
		var statusCode = secure.promptButton(name, returnText, x, y, width, height, onTouchImg);
        if (statusCode != 0) {
            logger.error('promptTouchArea: statusCode={}', statusCode);
        }
    } else {
        var xmlRequestObject = '<promptButton><name>' + name + '</name><x>' + x + '</x><y>' + y + '</y><width>' + width + '</width><height>' + height + '</height><text>' + returnText + '</text><image>' + onTouchImg + '</image></promptButton>';
        $.ajax({
            url: jPhoenixSettings.getBaseUrl() + "prompt/button",
            type: "POST",
            data: xmlRequestObject,
            contentType: "text/xml",
            dataType: "text",
            async: true,
            success: function () {
            }
        });
    }
}

/*
 * NAME
 *	promptLabelButton
 *
 * SYNOPSIS
 *	promptLabelButton( appName, langCode, domId, name, label, returnText, x, y, width, height, onTouchImg );
 *	Where:-
 * 		@param {string} appName - application name
 * 		@param {string} langCode - language code is optional - default is defaultLanguageCode form prompts.json
 * 		@param {string} domId - ID of the <div> tag to update with the button image and the button text
 * 		@param {string} name - name of the button. This need not be unique
 * 		@param {string} label - text label to show on the button. If empty, the button won't be shown
 * 		@param {string} returnText - text string to return when the defined button is touched
 *		@param {number} x - x co-ordinate
 *		@param {number} y - y co-ordinate
 * 		@param {number} width - width size of the button area
 * 		@param {number} height - height of the button area
 * 		@param {string} onTouchImg - (optional) name of a previously loaded secure resource image that will be shown while the area is touched.
 *
 * DESCRIPTION
 *	This function is used to add a button image with
 * 	dynamic button label text and enable a touch input area over a screen background image
 *
 *	This function is a combination of the text, image, and button controls with some
 *	JavaScript thrown in to control the display of the image and touch input based on
 *	the value of the text string.
 *
 *	If the label is evaluated to be empty (NULL), the image is NOT displayed
 *	and the touch input area is not enabled.  This allows for the generation of run time
 *	buttons such an an EMV card specific language selection button or application selection
 *	where the number of matching languages / applications is determined at run time after
 *	a smart card is inserted.
 *
 * EXAMPLE
 *	promptLabelButton( 'viking','en', 'ctrl_2', 'lblBtn', 'return text', 10, 390, 180, 77, 'viking');
 */
function promptLabelButton(appName, langCode, domId, name, label, returnText, x, y, width, height, onTouchImg) {
    logger.debug('promptLabelButton: appName={}, langCode={}, domId={}, name={}, label={}, returnText={}, x={}, y={}, width={}, height={}, onTouchImg={}', appName, langCode, domId, name, label, returnText, x, y, width, height, onTouchImg);
    if(langCode) {
        setupImage(domId, langCode);
    }
    promptText(appName, langCode, domId, label);
    promptTouchArea(name, onTouchImg, x, y, width, height, returnText);
}

/*
 * NAME
 *	promptText
 *
 * SYNOPSIS
 *	promptText( appName, langCode, domId, varText );
 *	Where:-
 * 		@param {string} appName - application name
 * 		@param {string} langCode - language code is optional - default is defaultLanguageCode form prompts.json
 * 		@param {string} domId - ID of the <div> tag to update with the button image and the button text
 * 		@param {string} varText - text that needs to be translated
 *
 * DESCRIPTION
 *	This function parses the text string and displays the completed string at the
 *	DOM with the ID dom_id.
 *
 *	The text string may include one or more of the following elements in any sequence:
 *	A specific string included in single quotes 'Hello'
 *	A variable value $variableName
 *	An index into the prompts.xml file #welcome
 *
 *	The complete string must be included in double quotes and may contain multiple
 *	text strings, multiple prompts.xml indexes and multiple variables.
 *
 * EXAMPLE
 *	"#greeting 'Steve' #transAmount $amount"
 *
 *	If the current terminal language is English, and the prompts.xml English index
 *	#greeting is 'Welcome' and the English prompts.json index #transAmount is
 *	'Transaction Amount' and the variable $amount has the value '$12.34' then the completed
 *	string will be
 *
 *	"WelcomeSteveTransaction Amount$12.34".
 *
 *	Obviously we need to include some spaces such as
 *	"#greeting ' Steve, ' #transAmount ' ' $amount" and this should display as:
 *
 *	"Welcome Steve, Transaction Amount $12.34"
 */
function promptText(appName, langCode, domId, varText) {
    /* This function analyse varText, replace all #prompts with language specific value and all $sysVar with current variable values and return array of all $sysVars  */
    _getCurrentPlaceholderValuesAndUpdateControlText = function (appName, langCode, domId, varText) {
        var variables = [];
        if(langCode && langCode.charAt(0) === '$') {
            variables.push(langCode.substring(1));
            langCode = variableGet(langCode.substring(1));
        }
        var varText = varText.replace(/"[^"]*"|([^"]+)/g, function (m, g) {
            if (g) {
                g = g.replace(/(\$[^#^$^<^"^\s+]*)/g, function (mVar, gVar) {
                    if (gVar) {
                        var varName = gVar.substring(1);
                        if ($.inArray(varName, variables) == -1) {
                            variables.push(varName);
                        }
                        var varValue = variableGet(varName);
                        if (varValue !== null && varValue.charAt(0) === '$') {
                            varValue = variableGet(varValue.substring(1));
                        } else if (varValue !== null && varValue.charAt(0) === '#') {
                            var promptId = varValue.substring(1);
                            varValue = langCode ? prompts.getPrompt(appName, promptId, langCode) : prompts.getDefaultLangPrompt(appName, promptId);
                        }
                        return varValue !== null ? varValue : 'Unable to Find Value';
                    } else return mVar;
                });
                g = g.replace(/(\#[^#^$^<^"^\s+]*)/g, function (mPrompt, gPrompt) {
                    if (gPrompt) {
                        var promptId = gPrompt.substring(1);
                        var promptValue = langCode ? prompts.getPrompt(appName, promptId, langCode) : prompts.getDefaultLangPrompt(appName, promptId);
                        return promptValue || 'Unable to Find Value';
                    } else return mPrompt;
                });
                return g;
            } else {
                return m.replace(/"/g, '');
            }
        });

        $('#' + domId).find('.label').html(varText);
        logger.debug('_getCurrentPlaceholderValuesAndUpdateControlText: value={}', varText);
        return variables;
    };

    try {
        logger.debug('promptText: appName={}, langCode={}, domId={}, varText={},', appName, langCode, domId, varText);
        var variables = _getCurrentPlaceholderValuesAndUpdateControlText(appName, langCode, domId, varText);
        variables.forEach(function (varName) {
            registerForVariable(varName, function () {
                _getCurrentPlaceholderValuesAndUpdateControlText(appName, langCode, domId, varText);
            });
        });
    } catch (e) {
        logger.error('promptText: error={}', e.message);
    }
}

/*
 * NAME
 *	promptSignedImage
 *
 * SYNOPSIS
 *	promptSignedImage( resourceName, x, y );
 *	Where:-
 *	 	@param {string} resourceName - name of a currently installed secure Background resource
 *		@param {number} x - x co-ordinate
 *		@param {number} y - y co-ordinate
 *
 * DESCRIPTION
 *	This function tells MQX to display the secure resource of type = Background onto the
 *	display.  This also sets up an area where there may be >8 touch input areas defined.
 *	This is required if there is a numeric or alphanumeric keyboard to be displayed on
 *	the LCD as there will be >= 10 touch areas required.
 *
 * EXAMPLE
 *	promptSignedImage( 'sign', 0, 0 );
 */
function promptSignedImage(resourceName, x, y, langCode) {
    resourceName = updateLangControlledSignedImageName(resourceName, langCode);
    logger.debug('promptSignedImage: resourceName={}, x={}, y={}, langCode={}', resourceName, x, y, langCode);
    var statusCode = secure.promptImage(resourceName, x, y);
    if (statusCode != 0) {
        logger.error('promptSignedImage: statusCode={}', statusCode);
    }
}

/*
 * NAME
 *	promptCheckbox
 *
 * SYNOPSIS
 *	promptCheckbox( appName, langCode, domId, name, resourceName, x, y, width, height, returnTextOff, returnTextOn, initialChecked, varText );
 *	Where:-
 * 		@param {string} appName - application name
 * 		@param {string} langCode - language code is optional - default is defaultLanguageCode form prompts.json
 * 		@param {string} domId - ID of the <div> tag to update with the translated text
 *	 	@param {string} name - name of the checkbox
 * 		@param {string} resourceName - resource name of the image on checkbox checked is optional
 *		@param {number} x - x co-ordinate
 *		@param {number} y - y co-ordinate
 * 		@param {number} width - width size of the checkbox area
 * 		@param {number} height- height of the checkbox area
 * 		@param {string} returnTextOff - text that is return when checkbox is unchecked
 *		@param {string} returnTextOn - text that is return when checkbox is checked
 * 		@param {0 or 1} initialChecked - value determines if checkbox is to be checked or not
 * 		@param {string} varText - text that needs to be translated
 *
 * DESCRIPTION
 *	This function defines a checkbox input area.
 *	The image on the display is assumed to include the checkbox picture (unchecked).
 *	This allows the user to define exactly what the checkbox looks like.
 *
 * EXAMPLE
 *	promptCheckbox('checkbox', 'checkbox2', 33, 20, 100, 0,'select1', 'unselect1', 1);
 */
function promptCheckbox(appName, langCode, domId, name, resourceName, x, y, width, height, returnTextOff, returnTextOn, initialChecked, varText) {
    if (initialChecked == true) {
        initialChecked = 1;
    } else {
        initialChecked = 0;
    }
    logger.debug('promptCheckbox: appName={}, langCode={}, domId={}, name={}, resourceName={}, x={}, y={}, width={}, height={}, returnTextOff={}, returnTextOn={}, initialChecked={}, varText={}', appName, langCode, domId, name, resourceName, x, y, width, height, returnTextOff, returnTextOn, initialChecked, varText);
    promptText(appName, langCode, domId, varText);
    if (isTerminal()) {
        var statusCode = secure.promptCheckbox(name, resourceName, returnTextOff, returnTextOn, x, y, width, height, initialChecked);
        if (statusCode != 0) {
            logger.error('promptCheckbox: statusCode={}', statusCode);
        }
    } else {
        var xmlRequestObject = '<promptCheckbox><name>' + name + '</name><text>' + returnTextOff + '</text><x>' + x + '</x><y>' + y + '</y><width>' + width + '</width>' +
            '<height>' + height + '</height><image>' + resourceName + '</image><text_on>' + returnTextOn + '</text_on><checked>' + initialChecked + '</checked></promptCheckBox>';

        $.ajax({
            type: "POST",
            url: jPhoenixSettings.getBaseUrl() + "prompt/checkbox",
            data: xmlRequestObject,  //working
            contentType: "text/xml",
            dataType: "text",
            async: true,
            success: function (data) {
            }
        });
    }
}

/*
 * NAME
 *	promptRadiobox
 *
 * SYNOPSIS
 *  promptRadiobox( appName, langCode, domId, name, resourceName, x, y, width, height, returnText, initialChecked, varText );
 *	Where:-
 * 		@param {string} appName - application name
 * 		@param {string} langCode - language code is optional - default is defaultLanguageCode form prompts.json
 * 		@param {string} domId - ID of the <div> tag to update with the translated text
 *	 	@param {string} name - name of the radiobox
 * 		@param {string} resourceName - resource name of the image on radiobox selected is optional
 *		@param {number} x - x co-ordinate
 *		@param {number} y - y co-ordinate
 * 		@param {number} width - width size of the radiobox area
 * 		@param {number} height- height of the radiobox area
 * 		@param {string} returnText - text that is return when radiobox is selected
 * 		@param {0 or 1} initialChecked - value determines if radiobox is to be selected or not
 * 		@param {string} varText - text that needs to be translated
 *
 * DESCRIPTION
 *	This function defines a radiobox input area.  The image on the display is assumed to include the original radiobox picture.
 *	This allows the user to define exactly what the radiobox looks like
 *
 * EXAMPLE
 *	promptRadiobox('radio', 'radiobox2', 33, 70, 100, 0, 'radio1', 1);
 */
function promptRadiobox(appName, langCode, domId, name, resourceName, x, y, width, height, returnText, initialChecked, varText) {
    if (initialChecked == true) {
        initialChecked = 1;
    } else {
        initialChecked = 0;
    }
    logger.debug('promptRadiobox: appName={}, langCode={}, domId={}, name={}, resourceName={}, x={}, y={}, width={}, height={}, returnText={}, initialChecked={}, varText={}', appName, langCode, domId, name, resourceName, x, y, width, height, returnText, initialChecked, varText);
    promptText(appName, langCode, domId, varText);
    if (isTerminal()) {
        var statusCode = secure.promptRadio(name, resourceName, returnText, x, y, width, height, initialChecked);
        if (statusCode != 0) {
            logger.error('promptRadiobox: statusCode={}', statusCode);
        }
    } else {
        var xmlRequestObject = '<promptRadiobox><name>' + name + '</name><text>' + text + '</text><x>' + x + '</x><y>' + y + '</y><width>' + width + '</width>' +
            '<height>' + height + '</height><image>' + resourceName + '</image><checked>' + initialChecked + '</checked></promptRadioBox>';

        $.ajax({
            type: "POST",
            url: jPhoenixSettings.getBaseUrl() + "prompt/radiobox",
            data: xmlRequestObject,  //working
            contentType: "text/xml",
            dataType: "text",
            async: true,
            success: function (data) {
            }
        });
    }
}

/*
 * NAME
 *	promptTextbox
 *
 * SYNOPSIS
 *  promptTextbox( name, x, y, w, h, initialString, textTemplate, valign, halign, kbdname, kbdx, kbdy, fontname );
 *	Where:-
 * 		@param {string} name - name of the textbox
 *		@param {number} x - x co-ordinate
 *		@param {number} y - y co-ordinate
 * 		@param {number} w - width
 * 		@param {number} h - height
 * 		@param {string} initialString - text shown when textbox is displayed.
 * 		@param {string or specialCharacters} textTemplate - TBD
 *		@param {number} valign -  TBD
 *		@param {number} halign -  TBD
 *		@param {string} kbdname -  type of keyboard to be displayed for textbox (previosly loaded resouce image file)
 *		@param {number} kbdx -  x co-ordinate for keyboard
 *		@param {number} kbdy -  y co-ordinate for keyboard
 *		@param {string} fontname -  textbox font resource name (previosly loaded font resouce), default font is used when empty
 *
 * DESCRIPTION
 *	This Function defines a textbox input area.  The image on the display is assumed to include the original textbox picture.
 *	This allows the user to define exactly what the textbox looks like
 *
 * EXAMPLE
 *	promptTextbox("textbox",155,105,460,40,"","@@@@@@@@@@",0,0,"keyboard0",0,200,"TimesRoman12");
 */
function promptTextbox(name, x, y, w, h, initialString, textTemplate, valign, halign, kbdname, kbdx, kbdy, fontname) {
    logger.debug('promptTextbox: name={}, x={}, y={}, width={}, height={}, initialString={}, textTemplate={}, valign={}, halign={}, kbdname={}, kbdx={}, kbdy={}, fontname={}', name, x, y, w, h, initialString, textTemplate, valign, halign, kbdname, kbdx, kbdy, fontname);
    if (isTerminal()) {
        var newfont = (null == fontname) ? "" : fontname;
        var statusCode = secure.promptTextbox({
            name: name, textTemplate: textTemplate, initialString: initialString, x: x, y: y, w: w, h: h,
            valign: valign, halign: halign, kbdx: kbdx, kbdy: kbdy, kbdname: kbdname, fontname: newfont
        });
        if (statusCode != 0) {
            logger.error('promptTextbox: statusCode={}', statusCode);
        }
    } else {
        var xmlRequestObject = '<promptTextbox><name>' + name + '</name><template>' + textTemplate + '</template><x>' + x + '</x>' +
            '<y>' + y + '</y><width>' + w + '</width><height>' + h + '</height><valign>' + valign +
            '</valign><halign>' + halign + '</halign>' + '<keypadx>' + kbdx + '</keypadx><keypady>' + kbdy +
            '</keypady><keypadname>' + kbdname + '</keypadname><font>' + font + '</font></promptTextbox>';
        $.ajax({
            type: "POST",
            url: jPhoenixSettings.getBaseUrl() + "prompt/textbox",
            data: xmlRequestObject,
            contentType: "text/xml",
            dataType: "text",
            async: true,
            success: function (data) {
            }
        });
    }
}

/*
 * NAME
 *	promptSignature
 *
 * SYNOPSIS
 *  promptSignature( name, x, y, width, height, color );
 *	Where:-
 * 		@param {string} name - name of the signature box
 *		@param {number} x - x co-ordinate of the signature box
 *		@param {number} y - y co-ordinate of the signature box
 * 		@param {number} width - width size of the signature area
 * 		@param {number} height- height of the signature area
 * 		@param {string} color - color in "rgb(rr,gg,bb)" format
 *
 * DESCRIPTION
 *	This function defines an input area that will accept a signature.
 *	The display is assumed to already include the image of a box defining the signature input space.
 *  This allows the user to define exactly what the signature input area looks like
 *
 * EXAMPLE
 *	promptSignature( 'signature',  72, 72, 647, 326, "rgb(255, 62, 109)" );
 */
function promptSignature(name, x, y, width, height, rgbColor) {
    logger.debug('promptSignature: name={}, x={}, y={}, width={}, height={}, rgbColor={}', name, x, y, width, height, rgbColor);
    var intColor = 128; //default is blue pen
    if(rgbColor) {
        intColor = rgbStringToInt(rgbColor);
    }
    if (isTerminal()) {
        var statusCode = secure.promptSignature(name, x, y, width, height, intColor);
        if (statusCode != 0) {
            logger.error('promptSignature: statusCode={}', statusCode);
        }
    } else {
        var xmlRequestObject = '<promptSignature><name>' + name + '</name><x>' + x + '</x>' +
            '<y>' + y + '</y><width>' + width + '</width><height>' + height + '</height><color>' + intColor + '</color></promptSignature>';
        $.ajax({
            type: "POST",
            url: jPhoenixSettings.getBaseUrl() + "prompt/signature",
            data: xmlRequestObject,
            contentType: "text/xml",
            dataType: "text",
            async: true,
            success: function (data) {
            }
        });

    }
}

/*
 * NAME
 *	promptPinBlock
 *
 * SYNOPSIS
 *  promptPinBlock( keySlotId, masterKeyId, timeout, interTmout, pinY, key, verifyOnline, AllowPinEntryBypass );
 *	Where:-
 * 		@param {number} keySlotId - key slot id
 *		@param {number} masterKeyId - master key id
 *		@param {number} timeout - pin entry screen timeout in seconds
 * 		@param {number} interTmout - pin entry screen timeout in seconds (between key presses)
 * 		@param {number} pinY - Y coordinate of pin entry box
 * 		@param {*key} key - master key encrypted session key (binary data)
 * 		@param {boolean} verifyOnline - true - online PIN verification, false - offline PIN verification
 *  	@param {boolean} AllowPinEntryBypass -  setting this to false disables *bypass* button during pin entry
 *
 * DESCRIPTION
 *	This function prompts for, and returns an encrypted PIN block.
 *	The function assumes that the display already contains an image prompting the user to enter their PIN.
 *	This image need not be signed as when the running application invokes a page with a Pinblock control,
 *	the Pinblock function wil only return an encrypted Pinblock and not the user's PIN.
 *
 * EXAMPLE
 *	promptPinBlock( 0, 0, 60, 30, 128, 'D85A35712D64465FD85A35712D64465FD85A35712D64465F', 1, 1 );
 */
function promptPinBlock(keySlotId, masterKeyId, timeout, interTmout, pinY, key, verifyOnline, AllowPinEntryBypass) {
    logger.debug('promptPinBlock: keySlotId={}, masterKeyId={}, timeout={}, interTmout={}, pinY={}, key={}, verifyOnline={}, AllowPinEntryBypass={}', keySlotId, masterKeyId, timeout, interTmout, pinY, key, verifyOnline, AllowPinEntryBypass);
    if (isTerminal()) {
        var keyArray = [];
        for (var byte in key.match(/(..?)/g)) {
            keyArray.push(parseInt(byte, 16));
        }
        var statusCode = secure.requestPIN(
            keySlotId, masterKeyId, timeout,
            interTmout, pinY, keyArray,
            verifyOnline, AllowPinEntryBypass);
        if (statusCode != 0) {
            logger.error('promptPinBlock: statusCode={}', statusCode);
        }
    } else {
        var xmlRequestObject = '<promptPinblock>' +
            '<keySlotId>' + keySlotId + '</keySlotId>' +
            '<mkid>' + masterKeyId + '</mkid>' +
            '<timeout1>' + timeout + '</timeout1>' +
            '<timeout2>' + interTmout + '</timeout2>' +
            '<y>' + pinY + '</y>' +
            '<key>' + key + '</key>' +
            '<isOnline>' + verifyOnline + '</isOnline>' +
            '<AllowPinEntryBypass>' + AllowPinEntryBypass + '</AllowPinEntryBypass>' +
            '</promptPinblock>';
        $.ajax({
            type: "POST",
            url: jPhoenixSettings.getBaseUrl() + "prompt/pinblock",
            data: xmlRequestObject,
            contentType: "text/xml",
            dataType: "text",
            async: true,
            success: function () {
            }
        });
    }
}

/*
 * NAME
 *	promptEditBox
 *
 * SYNOPSIS
 *  promptEditBox( promptResourceId, promptId, titleResourceId, titleId, timeout, text );
 *	Where:-
 * 		@param(number) promptResourceId
 *		@param(number) promptId
 *		@param(number) titleResourceId
 *  	@param(number) titleId
 * 		@param(string) text
 * 		@param(number) timeout - optional
 *
 * DESCRIPTION
 *	This function prompts for Edit Box with some default values if defined or else it accepts number values
 *	for amounts with a decimal point.
 *
 * EXAMPLE
 *	promptEditBox( 160, 1, 170, 1, 30, "888" );
 */
function promptEditBox(promptResourceId, promptId, titleResourceId, titleId, timeout, text) {
    logger.debug('promptEditBox: promptResourceId={}, promptId={}, titleResourceId={}, titleId={}, timeout={}, text={}', promptResourceId, promptId, titleResourceId, titleId, timeout, text);
    if (isTerminal()) {
        var statusCode = secure.promptEditbox(promptResourceId, promptId, titleResourceId, titleId, timeout, text);
        if (statusCode != 0) {
            logger.error('promptEditBox: statusCode={}', statusCode);
        }
    } else {
        var xmlRequestObject = '<promptEditbox><promptResourceId>' + promptResourceId + '</promptResourceId><promptId>' + promptId + '</promptId>' +
            '<titleResourceId>' + titleResourceId + '</titleResourceId><titleId>' + titleId + '</titleId><text>' + text + '</text>' +
            '<timeout>' + timeout + '</timeout></promptEditbox>';
        $.ajax({
            type: "POST",
            url: jPhoenixSettings.getBaseUrl() + "prompt/editbox",
            data: xmlRequestObject,
            contentType: "text/xml",
            dataType: "text",
            async: true,
            success: function (data) {
            }
        });
    }
}

/*
 * NAME
 *	setupImage
 *
 * SYNOPSIS
 *  setupImage( domId, langCode );
 *	Where:-
 * 		@param(string) domId
 *		@param(array) langCode
 *
 * DESCRIPTION
 *	This function ...
 *
 * EXAMPLE
 *	     setupImage("ctrl_id", "$langCode")
 *
 */
function setupImage(domId, langCode) {
    logger.debug('setupImage: domId={}', domId);
    var imagesLength = $('#' + domId).find('img').length;
    displayImageAndStartTimer(domId, imagesLength, 0);

    if (langCode && langCode.charAt(0) === '$') {
        registerForVariable(langCode.substring(1), function () {
            displayLangControlledImage(domId, langCode);
        });
    }
    if (langCode) {
        displayLangControlledImage(domId, langCode);
    }
}

function setupPageBackgroundImage(langCode) {
    if (langCode && langCode.charAt(0) === '$') {
        registerForVariable(langCode.substring(1), function () {
            displayLangControlledImage(undefined, langCode);
        });
    }
    if (langCode) {
        displayLangControlledImage(undefined, langCode);
    }
}

function displayImageAndStartTimer(divId, imagesLength, currentIndex) {
    if (currentIndex === imagesLength) {
        currentIndex = 0;
    }
    $('#' + divId).find('img').hide();
    var image = $('#' + divId).find('img:eq(' + currentIndex + ')');
    image.show();
    if(imagesLength && imagesLength > 1) {
        var duration = image.attr('eq-duration') * 1000;
        setTimeout(function () {
            currentIndex += 1;
            displayImageAndStartTimer(divId, imagesLength, currentIndex);
        }, duration)
    }
}

function displayLangControlledImage(domId, langCode) {
    if (!domId) {
        var imagePath = document.body.style.backgroundImage;
        var newPath = updateLangControlledPath(imagePath, langCode);
        if (imagePath !== newPath) {
            logger.debug('displayLangControlledImage: Page background image "{}" replaced with image "{}"', imagePath, newPath);
            document.body.style.backgroundImage = newPath;
        }
    } else {
        $('#' + domId + ' img').each(function () {
            var newPath = updateLangControlledPath(this.src, langCode);
            if (this.src !== newPath) {
                logger.debug('displayLangControlledImage: Image "{}" inside parent element with id={} replaced with image "{}"', this.src, domId, newPath);
                this.src = newPath;
            }
        });
    }
}

function updateLangControlledPath(filePath, langCode) {
    if (langCode && langCode.charAt(0) === '$') {
        langCode = variableGet(langCode.substring(1));
    }
    if (langCode) {
        var fileName = filePath.split('/').pop();
        fileName = fileName.substring(0, fileName.lastIndexOf('.'));
        var fileExtension = filePath.split('.').pop();
        var currentLangCode;
        if (fileName.indexOf('.') > -1) {
            currentLangCode = fileName.split('.').pop();
        }
        if (!currentLangCode || currentLangCode !== langCode) {
            fileName = currentLangCode ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
            return filePath.substring(0, filePath.lastIndexOf('/') + 1) + fileName + '.' + langCode + '.' + fileExtension;
        }
    }
    return filePath;
}

function updateLangControlledSignedImageName(signedImageName, langCode) {
    if (langCode && langCode.charAt(0) === '$') {
        langCode = variableGet(langCode.substring(1));
    }
    if (langCode) {
        var currentLangCode;
        if (signedImageName.indexOf('.') > -1) {
            signedImageName = signedImageName.substring(0, signedImageName.lastIndexOf('.'));
            currentLangCode = signedImageName.split('.').pop();
        }
        if (!currentLangCode || currentLangCode !== langCode) {
            return signedImageName + '.' + langCode;
        }
    }
    return signedImageName;
}

/*
 * ============================================================================================================
 *    								   	 jphoenix page functions
 * ============================================================================================================
 */
var previewMode;
/*
 * NAME
 *	pageShow
 *
 * SYNOPSIS
 *	pageShow( path );
 *	Where:-
 *		path is the relative (to home) location of html page
 *
 * DESCRIPTION
 *  This function loads the page on terminal
 *
 * EXAMPLE
 *	pageShow("viking/html/index.html");
 */
function pageShow(path) {
    logger.debug('pageShow: path={}', path);
    if (isTerminal()) {
        if (previewMode && (previewMode === 'previewOnTerminal' || previewMode === 'localPreview')) {
            path = 'tmp/pagebuilder.preview' + path.substring(path.indexOf('/'));
        }
        var statusCode = page.showPage(jPhoenixSettings.getBaseUrl() + 'page/show?path=' + path);
        if (statusCode != 0) {
            logger.error('pageShow: statusCode={}', statusCode);
        }
    } else {
        $.get(jPhoenixSettings.getBaseUrl() + 'page/show', {path: path}, function (data) {
            return data;
        });
    }
}

/*
 * NAME
 *	setPreviewMode
 *
 * SYNOPSIS
 *	setPreviewMode( mode );
 *	Where:-
 * 		@param(string) mode - could be 'previewOnTerminal' or 'localPreview'
 *
 * DESCRIPTION
 *  This function is called just in preview mode (local or terminal).
 */
function setPreviewMode(mode) {
    logger.debug('setPreviewMode: mode={}', mode);
    previewMode = mode;
}

/*
 * ============================================================================================================
 *    								   	 jphoenix variable functions
 * ============================================================================================================
 */

/*
 * NAME
 *	variableGet
 *
 * SYNOPSIS
 *  variableGet( varName );
 *	Where:-
 * 		@param {string} varName - name of the variable
 *	 	@return {string} content - value for the name of the variable
 *
 * DESCRIPTION
 *	This function will retrieve and return the named variable from the system using the URL http://localhost/cgi-bin/variable/get
 *	which in turn calls the CGI binary /home/variable/cgi-bin/get.
 *
 * EXAMPLE
 *
 */
function variableGet(varName) {
    var content;
    if (isTerminal()) {
        content = registry.getValue(varName);
        if (content === null) {
            logger.error('variableGet: Unable to get variable {} value', varName);
        } else {
            logger.info("variableGet: varName={}, value={}", varName, content);
        }
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
                    if (variable[i].innerHTML == "") {
                        content = false;
                    } else {
                        content = response.documentElement.textContent;
                    }
                }
            }
        });
    }
    return content;
}

/*
 * NAME
 *	variableSet
 *
 * SYNOPSIS
 *  variableSet( name, value );
 *	Where:-
 * 		@param {string} name - name of the variable
 * 		@param {*(string, number, blob)} value - value set to the name
 *
 * DESCRIPTION
 *	This function calls the internal cgi-bin URL http://localhost/cgi-bin/variable/set to set the value of one of more variables.
 *	Note:  To speed up the processing, the function supports a JSON formatted list of variables/values
 *	to allow for the setting of multiple variables with a single function call.  Format TBD.
 *
 * EXAMPLE
 *
 */
function variableSet(name, value) {
    if (isTerminal()) {
        var response = registry.setValue(name, value);
        //todo check response value for error
        logger.info("variableSet: varName={}, value={}, response={}", name, value, response);
    } else {
        var type = determineTypeOfValue(value);
        var xmlRequestObject = "<registry><variable id=" + "'" + name + "'" + " type=" + "'" + type + "'" + ">" + value + "</variable></registry>";
        $.ajax({
            type: "POST",
            url: jPhoenixSettings.getBaseUrl() + "variable/set",
            //data:"<registry><variable id='Emv.Tag.9F02' type='blob'>000000002000</variable><variable id='tmp.integer.value' type='integer'>99</variable></registry>", // when multiple variables has to set
            data: xmlRequestObject,  //working
            contentType: "text/xml",
            dataType: "application/JSON",
            async: false,
            success: function (response) {
                var variable = response.getElementsByTagName("variable");
                if (variable.length == 0) {
                    //logs.ID1( "variable set successfully   " + response.childNodes[0].nodeName + '<br/>\n' );
                } else {
                    for (i = 0; i < variable.length; i++) {
                        var variableValues = variable[i];
                        if (variableValues.attributes.type.value === "error") {
                            console.log("error variable Field");
                        }
                    }
                }
            }
        });
    }
}

/*
 * NAME
 *	variableCopy
 *
 * SYNOPSIS
 *  variableCopy( varNameSrc, varNameDst );
 *	Where:-
 * 		@param {string} varNameSrc - name of the variable
 * 		@param {string} varNameDst - name of the variable
 *
 * DESCRIPTION
 *	This function copy value of variable varNameSrc to variable varNameDst
 *
 * EXAMPLE
 *
 */
function variableCopy(varNameSrc, varNameDst) {
    logger.debug('variableCopy: varNameSrc={} varNameDst={}', varNameSrc, varNameDst);
    var varValue = variableGet(varNameSrc);
    variableSet(varNameDst, varValue);
}

/*
 * NAME
 *	registerForVariable
 *
 * SYNOPSIS
 *  registerForVariable( variableName, callbackFunction );
 *	Where:-
 * 		@param {string} variableName - name of the variable
 * 		@return {function} callbackFunction - function that needs to be executed on variable value change.
 *
 * DESCRIPTION
 *	This function register callback functions that needs to be executed on variable value change.
 *  variableChangeCallbacks is map that contains  variableName -> [callbacks]
 *
 * EXAMPLE
 *
 */
var variableChangeCallbacks = {};

function registerForVariable(variableName, callbackFunction) {
    logger.debug('registerForVariable: variableName={}', variableName);
    if (!variableChangeCallbacks[variableName]) {
        //first callback for given variable
        variableChangeCallbacks[variableName] = [callbackFunction];
        //subscribe distinct variables just once
        registry.subscribe(variableName);
    } else {
        variableChangeCallbacks[variableName].push(callbackFunction);
    }
}

/*
 * ============================================================================================================
 *    								   	 jphoenix events and event listeners
 * ============================================================================================================
 */

/*
 * NAME
 *	registerForEvent
 *
 * SYNOPSIS
 *  registerForEvent( eventName, controlName, callbackFunction );
 *	Where:-
 * 		@param {string} eventName - name of the event to listen for: TODO: refactor to eventType
 *		@param {string} eventSourceName - name of event source
 *		@param {function} callbackFunction - callback that performs all the actions after an event received.
 *
 * DESCRIPTION
 *  This function registers listener for given event from given control.
 *  When event is fired, callbackFunction is called.
 *  Callback function signature should be function(name, text, response), where name is the name
 *  registeredEventsList @type {(Array)} - variable to save all the actions for events and their control names for future use
 *
 * EXAMPLE
 *  registerForEvent("onTouched", "confirm", function(name, text, response) {
 *  	beep(1);
 *  	processSignature();
 *  });
 */
var registeredEventsList = [];
var pageUpdateEvent;   //only one onUpdate is possible

function registerForEvent(eventName, eventSourceName, callbackFunction) {
    logger.debug('registerForEvent: eventName={}, eventSourceName={}', eventName, eventSourceName);

    if(eventName === "onUpdate") {
        pageUpdateEvent = {eventSourceName: eventSourceName, callbackFunction: callbackFunction};
    } else {
        for (var i = 0; i < registeredEventsList.length; i++) {
            if (eventSourceName === registeredEventsList[i].eventSourceName && eventName === registeredEventsList[i].eventName) {
                registeredEventsList[i].actions = callbackFunction;
                return;
            }
        }
        registeredEventsList.push({eventSourceName: eventSourceName, eventName: eventName, actions: callbackFunction});
    }
}

/*
 * NAME
 *	promptEvent
 *
 * SYNOPSIS
 *  promptEvent( timeout );
 *	Where:-
 * 		@param {string} timeout - time to wait for the events from the terminal
 *
 * DESCRIPTION
 *  This activates all touch input areas defined by promptTouchArea(), promptCheckbox(), promptRadiobox() etc...
 *
 * EXAMPLE
 *  promptEvent( 20 );
 */
function promptEvent(timeout) {
    if (typeof timeout == "undefined") {
        timeout = -1;
    }
    if (isTerminal()) {
        var responseData = secure.promptEvent(timeout, true);
        if (responseData && responseData.status == 0) {
            logger.debug('promptEvent: responseData={}', responseData);
        } else {
            logger.error('promptEvent: responseData={}', responseData);
        }

    } else {
        $.ajax({
            url: jPhoenixSettings.getBaseUrl() + "prompt/event",
            type: "POST",
            contentType: "text/xml",
            dataType: "text",
            async: true,
            data: '<?xml version="1.0"?><promptEvent><timeout>' + timeout + '</timeout></promptEvent>',
            success: callBackFunction,
        });
    }
}

/*
 * NAME
 *	callBackFunction
 *
 * SYNOPSIS
 *  callBackFunction( data );
 *	Where:-
 * 		@param {string or xmlObject} data - success response from promptEvent()
 *
 * DESCRIPTION
 *	This callback is called from promptEvent() function onSuccess
 *
 * EXAMPLE
 *
 */
function callBackFunction(data) {
    if (typeof data === 'object') {
        Object.keys(data).forEach(function (key) {
            var name = key;
            var text = data[key];
            for (var i = 0; i < registeredEventsList.length; i++) {
                if (registeredEventsList[i].eventSourceName === name) {
                    registeredEventsList[i].actions(name, text, data);
                }
            }
        });
    } else {
        if (data && data.indexOf('TIMEOUT') != -1) {
            //do something when timeout occurs
            return;
        }
        var specialHandling = null;
        if (typeof data === 'string' && data != 'canceled') {
            $(data).find("prompt").each(function () {
                try {
                    var prompt = $(this);
                    var name = prompt.find('name').text();
                    var text = prompt.find('text').text();
                    // trigger appropriate callback
                    for (var i = 0; i < registeredEventsList.length; i++) {
                        if (registeredEventsList[i].eventSourceName === name) {
                            registeredEventsList[i].actions(name, text, data);
                            specialHandling = 1;
                        }
                    }
                } catch (e) {
                    logs.log('Error parsing secure input: ' + e.message + ', data: ' + data);
                }
            });
            //promptEvent();

            if (specialHandling == null) {
                // Treat this as an XML and call key handlers if any
                var xml = jQuery.parseXML(data);
                if (xml) {
                    var x = xml.getElementsByTagName("*");
                    for (var i = 0; i < x.length; ++i) {
                        var key = x[i].nodeName;
                        var val = null;
                        if (x[i].firstChild != null) {
                            val = x[i].firstChild.nodeValue;
                        }
                        for (var j = 0; j < registeredEventsList.length; ++j) {
                            if (registeredEventsList[j].eventSourceName === key) {
                                registeredEventsList[j].actions(key, val, xml);
                            }
                        }
                    }
                }
            }
        }
    }
}

/*
 * NAME
 *	fireEvent
 *
 * SYNOPSIS
 *  fireEvent( response );
 *	Where:-
 * 		@param {*} response - could be any event, text
 *
 * DESCRIPTION
 *	This function adds an event to an event queue that a waiting application can read by calling the URL http://URL/cgi-bin/page/event.
 * 	Note that the calling application my be resident on the Luxe terminal or external to the terminal.
 *	The event name, type and ID are all determined from the element that called the function
 *
 * EXAMPLE
 *
 */
function fireEvent(response) {
    logger.debug('fireEvent: response={}', response);
    page.fireEvent(response);  //fireEvent is implemented in page (WebKit Bridge) object
}

/**
 * fireXMLEvent()
 */

/*
 * NAME
 *	fireXmlEvent
 *
 * SYNOPSIS
 *  fireXmlEvent( x );
 *
 * DESCRIPTION
 *	todo This function needs to be refactored or eliminated in future.
 *
 * EXAMPLE
 *
 */
function fireXmlEvent(x) {
    $.get('/cgi-bin/page/.fireEvent', {RAW_XML: x}, "text").done(function (data) {
        console.log('from fireXMLEvent', data);
    });
}

/*
 * NAME
 *	processDivBoxUpdate
 *
 * SYNOPSIS
 *  processDivBoxUpdate();
 *
 * DESCRIPTION
 *	todo add description and consider to move this function to section "jphoenix actions"
 *
 * EXAMPLE
 *
 */
function processDivBoxUpdate(data) {
    divBoxXMLParser.parseXML(data);
}

/**
 * @type {object} divBoxXMLParser
 * @property {string} parseXML - parses the xml data and appends text to DOM elements
 */
var divBoxXMLParser = {
    parseXML: function( data ) {
        var xmlDoc = $.parseXML( data );
        var $xml = $(xmlDoc);
        var $update = $xml.find("update");

        $update.each(function(){
            var update = $(this);
            if(update.length == 0){
                return;
            }
            var updateAction = update[0].getAttribute('action');
            var updateId = update[0].getAttribute('id');
            var children = update[0].childNodes;
            for (j = 0; j < children.length; j++) {
                if( children[j].nodeName == "text" ) {
                    updateText = children[j].textContent;
                    if( updateAction == "append" ) {
                        $('#' + updateId).append(updateText + '<br/>\n');
                        updateScroll(updateId);
                    } else if( updateAction == "prepend" ) {
                        $('#' + updateId).prepend(updateText);
                    } else if( updateAction == "replace" ) {
                        $('#' + updateId).html(updateText);
                    } else if( updateAction == "delete" ) {
                        $('#' + updateId).empty();
                    }
                }
            }
        });
    }
};

/*
 * ============================================================================================================
 *    								        on page load
 * ============================================================================================================
 */

/*
 * DESCRIPTION
 *	Connect Secure Input signals just once
 */
(function () {
    logger.debug("on page load, registering event listeners: page={}", window.location.pathname);
    if (isTerminal()) {

        page.onPageUpdate.connect( function( data ) {
            if(pageUpdateEvent) {
                logger.debug("page.onPageUpdate event arrived: data='{}'", data);
                pageUpdateEvent.callbackFunction(pageUpdateEvent.eventSourceName, data, data);
            } else {
                logger.warn("page.onPageUpdate event arrived, onUpdate event not set !: data='{}'", data);
            }
        });

        secure.onSecureInput.connect(function (data) {
            try {
                logger.debug("secure.onSecureInput event arrived: data='{}'", data);
                if (data) {
                    callBackFunction(data);
                }
            } catch (e) {
                logs.log(e.message);
            } finally {
                //secure.onSecureInput.disconnect();
            }
        });

        // Receive PIN entry results
        secure.onPinEntryCompleted.connect(function (_isPinEntered, _isPinEntryBypassed, _isPinEntryTimeout, _pinblock) {
            var data = {
                isPinEntered: _isPinEntered,
                isPinEntryBypassed: _isPinEntryBypassed,
                isPinEntryTimeout: _isPinEntryTimeout,
                pinblock: _pinblock
            };
            logger.debug("secure.onPinEntryCompleted  event arrived: data='{}'", data);
            callBackFunction(data);
        });

        //	Variable value change
        registry.valueChanged.connect(function (variableName, newVal) {
            logger.debug("registry.valueChanged  event arrived: variableName={}, newVal='{}'", variableName, newVal);
            //NOTE: temporary workaround for https://jira.eqpmt.net/browse/PHX-1068
            if ((newVal!=null) && (newVal.length==1) && (newVal.charCodeAt(0)==0)) {
                newVal = "";
            }
            var vcList = variableChangeCallbacks[variableName];
            if (vcList) {
                vcList.forEach(function (callback) {
                    callback(null, newVal); //currenty platform doesn't provide oldValue
                });
            }
        });
    }
})();

/*
 * ============================================================================================================
 *    										jphoenix actions
 * ============================================================================================================
 */

/*
 * NAME
 *	beepEx
 *
 * SYNOPSIS
 *  beepEx( repeat, freq, length, delay );
 *	Where:-
 * 	  	@param {number} repeat - number of times to beep sound
 * 		@param {number} freq - frequency number
 * 		@param {number} length - length of a beep in milliseconds
 * 		@param {number} delay - delay time gap between each beep sound in milliseconds
 * 		@return {string} success data
 *
 * DESCRIPTION
 *	This function makes beep sounds with specific frequency, length of a beep, time gap between each beep.
 *
 * EXAMPLE
 *
 */
function beepEx(repeat, freq, length, delay) {
    logger.debug('beepEx: repeat={}, freq={}, length={}, delay={}', repeat, freq, length, delay);
    var statusCode = tools.beep(repeat, freq, length, delay);
    if (statusCode != 0) {
        logger.error('beepEx: statusCode={}', statusCode);
    }
}

/*
 * NAME
 *	beep
 *
 * SYNOPSIS
 *  beep( numberOfBeeps );
 *	Where:-
 * 	  	@param {number} numberOfBeeps - number of times to beep
 * 		@return {string} success data
 *
 * DESCRIPTION
 *	This function makes beep sounds.
 *
 * EXAMPLE
 *
 */
function beep(numberOfBeeps) {
    logger.debug('beep: numberOfBeeps={}', numberOfBeeps);
    var statusCode = tools.beep(numberOfBeeps, 450, 50, 50);
    if (statusCode != 0) {
        logger.error('beep: statusCode={}', statusCode);
    }
}

/*
 * NAME
 *	setSpeakerVolume
 *
 * SYNOPSIS
 *  setSpeakerVolume( volume );
 *	Where:-
 * 	  	@param {number} volume
 * 		@return {string} success data
 *
 * DESCRIPTION
 *	This function set speaker volume.
 *
 * EXAMPLE
 *
 */
function setSpeakerVolume(volume) {
    logger.debug('setSpeakerVolume: volume={}', volume);
    var statusCode = tools.setSpeakerVolume(volume);
    if (statusCode == -1) {
        logger.error('setSpeakerVolume: statusCode={}', statusCode);
    }
}

/*
 * NAME
 *	getSpeakerVolume
 *
 * SYNOPSIS
 *  getSpeakerVolume( );
 *	Where:-
 * 		@return {string} speaker volume
 *
 * DESCRIPTION
 *	This function set speaker volume.
 *
 * EXAMPLE
 *
 */
function getSpeakerVolume() {
    var response = tools.getSpeakerVolume();
    if (response == -1) {
        logger.error('getSpeakerVolume: statusCode={}', response);
    } else {
        logger.debug('getSpeakerVolume: volume={}', response);
    }
}

/*
 * NAME
 *	run
 *
 * SYNOPSIS
 *  runProcess(application, binary, parameters);
 *	Where:-
 * 	  	@param {string} application - application whose binary to execute
 * 	  	@param {string} binary - binary whose binary to execute from /home/<application/bin/* directory
 * 	  	@param {string} parameters - command line parameters to pass to binary
 *
 * DESCRIPTION
 *	This function runs binary async (doesnt wait for binary execution to complete).
 *
 * EXAMPLE runProcess("moneris", "runEMVTransaction", "-i abc -j def");
 *
 */
function runProcess(application, binary, parameters){
    logger.debug('runProcess: application={}, binary={}, parameters={}', application, binary, parameters);
    var statusCode = tools.runProcessAsync(application, binary, parameters);
    if (statusCode == -1) {
        logger.error('runProcess: statusCode={}', statusCode);
    }
}

/*
 * NAME
 *	logDebug
 *
 * SYNOPSIS
 *  logDebug( );
 *	Where:-
 * 		@msg {string} Text to send to log file
 *
 * DESCRIPTION
 *	This function log messages into log file.
 *
 * EXAMPLE
 *
 */
function logDebug(msg) {
    logger.debug(msg);
}