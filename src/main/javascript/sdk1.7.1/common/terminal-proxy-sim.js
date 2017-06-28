var nfc = {}, printer = {}, p2pe = {}, scr = {}, utils = {}, installer = {}, camera = {};

//var terminalHost = "172.20.177.67";
//var terminalHost = window.location.host;
//var _terminalBaseUrl = "http://" +  terminalHost + "/cgi-bin/";

var sim_dom_elems_prefix = "sim_";

var tools = {
    beep: function (repeat, freq, length, delay) {
        return 0;
    },
    setSpeakerVolume: function (volume) {
        //return  -1 on error, otherwise 0
        return 0;
    },
    getSpeakerVolume: function () {
        //return  -1 on error otherwise returns volume
        return 0;
    },
    runProcessAsync: function (application, binary, parameters) {
        return 0;
    }
};

var log = {
    error: function (msg) {
        console.error(msg);

    },
    warn: function (msg) {
        console.warn(msg);
    },
    info: function (msg) {
        console.info(msg);

    },
    debug: function (msg) {
        console.debug(msg);
    }
};

var pageUpdateCallbacks = [];
var page = {
    showPage: function (pageUrl) {
        var path = getQueryString('path', pageUrl);
        path = '/html/' + path;
        parent.document.getElementById("pageTitle").innerHTML = "page: '" + path + "'";
        window.location.href = path;
        return 0;
    },
    fireEvent: function (data) {
        console.log('fireEvent', data);
        sendEventToTerminal("fireEvent", "<![CDATA[" + data + "]]>");

    },
    onPageUpdate: {
        connect: function (callback) {
            pageUpdateCallbacks.push(callback);
        }
    }
};

var secureInputCallbacks = [];
var pinEntryCompletedCallback;
var pinTimeout;
var secure = {
    promptMSR: function () {
        return 0;
    },
    promptClear: function () {
        return 0;
    },
    promptButton: function (name, text, x, y, width, height, onTouchImg) {
        var control = {
            class: 'touchArea',
            name: name,
            text: text,
            x: x,
            y: y,
            width: width,
            height: height,
            onTouchImg: onTouchImg
        };
        createSimDomElement(control);
        return 0;
    },
    promptImage: function (imageName, x, y) {
        var control = {class: 'signedImage', name: imageName, x: x, y: y};
        controls.addControl(control);
        createSimDomElement(control);
        return 0;
    },
    promptCheckbox: function (name, onTouchImg, returnText, returnTextOn, x, y, width, height, checked) {
        var control = {
            class: 'checkbox',
            name: name,
            returnText: returnText,
            returnTextOn: returnTextOn,
            x: x,
            y: y,
            width: width,
            height: height,
            onTouchImg: onTouchImg,
            checked: checked
        };
        controls.addControl(control);
        createSimDomElement(control);
        return 0;
    },
    promptRadio: function (name, onTouchImg, returnText, x, y, w, h, checked) {
        var control = {
            class: 'radiobox',
            name: name,
            returnText: returnText,
            x: x,
            y: y,
            width: w,
            height: h,
            onTouchImg: onTouchImg,
            checked: checked
        };
        controls.addControl(control);
        createSimDomElement(control);
        return 0;
    },
    promptTextbox: function (textBoxObj) {
        textBoxObj.class = 'textbox';
        textBoxObj.width = textBoxObj.w;
        textBoxObj.height = textBoxObj.h;
        controls.addControl(textBoxObj);
        createSimDomElement(textBoxObj);
        return 0;
    },
    promptSignature: function (name, x, y, width, height, color) {
        var control = {class: 'signature', name: name, x: x, y: y, width: width, height: height, color: color};
        controls.addControl(control);
        createSimDomElement(control);
        return 0;
    },
    requestPIN: function (keySlotId, masterKeyId, timeout, interTmout, pinY, keyArray, verifyOnline, AllowPinEntryBypass) {
        //todo missing control params
        pinTimeout = setTimeout(function () {
            pinTimeout = undefined;
        }, timeout)
        return 0;
    },
    promptEditbox: function (promptResourceId, promptId, titleResourceId, titleId, timeout, text) {
        return 0;
    },
    promptEvent: function (timeout, param) {
        return {status: 0, value: 0};
    },
    onSecureInput: {
        connect: function (callback) {
            secureInputCallbacks.push(callback);
        }
    },
    onPinEntryCompleted: {
        connect: function (callback) {
            pinEntryCompletedCallback = callback;
        }
    }
};
if(window.parent.useExternalTerminal === "true") {
    var registry = {
        _registry: {},
        _valueChangedCallbacks: [],
        setValue: function (varName, value) {
            var type = determineTypeOfValue(value);
            var xmlRequestObject = "<variable><set id=" + "'" + varName + "'" + " type=" + "'" + type + "'" + ">" + value + "</set></variable>"
            $.ajax({
                type: "POST",
                url: "/cgi-bin/variable/set",
                data: xmlRequestObject,  //working
                contentType: "text/xml",
                async: false,	//have to be sync in order to ensure registry update before next instruction. candidate for refactoring
                dataType: "xml",
                success: function (response) {
                    if (response.textContext != null) {//empty <registry></registry> element means ok
                        console.log("error setting variable: " + varName);
                    }
                }
            });
            return {value: 0};
        },
        getValue: function (varName) {
            var registryValue = null;

            $.ajax({
                type: "GET",
                url: '/cgi-bin/variable/get',
                data: varName,
                dataType: "xml",
                async: false,	//have to be sync in order to return value right away. candidate for refactoring
                success: function (response) {
                    var variable = response.getElementsByTagName("get");
                    if ((variable.length > 0) && variable[varName]) {
                        registryValue = variable[varName].textContent;
                    }
                }
            });
            return registryValue;
        },
        valueChanged: {
            connect: function (callback) {
                registry._valueChangedCallbacks.push(callback);
            }
        },
        subscribe: function (varName) {
            sendEventToTerminal("registerForVariable", "<varName>" + varName + "</varName>");
        }
    };
} else {

    var registry = {
        _registry: {},
        _valueChangedCallbacks: [],
        _subscribers: [],
        setValue: function (varName, value) {
            var registryItem = this._registry[varName];
            if (registryItem) {
                registryItem.value = value;
            } else {
                this._registry[varName] = {value: value};
            }
            if (registry._subscribers.indexOf(varName) > -1) {
                registry._valueChangedCallbacks.forEach(function (callback) {
                    callback(varName, value);
                })
            }
        },
        getValue: function (varName) {
            var registryItem = this._registry[varName];
            return registryItem ? registryItem.value : null;
        },
        valueChanged: {
            connect: function (callback) {
                registry._valueChangedCallbacks.push(callback);
            }
        },
        subscribe: function (varName) {
            registry._subscribers.push(varName);
        }
    };
}

var controls = {
    _controls: [],
    addControl: function (control) {
        this._controls.push(control);
    },
    findControlByClass: function (controlClass) {
        for (var i = 0; i < this._controls.length; i++) {
            if (this._controls[i].class === controlClass) {
                var control = this._controls[i];
                return control;
            }
        }
        return undefined;
    },
    findControlById: function (id) {
        for (var i = 0; i < this._controls.length; i++) {
            if (this._controls[i].id === id) {
                return this._controls[i];
            }
        }
        return undefined;
    },
    findControlsByClassAndPropertyValue: function (controlClass, property, value) {
        var controls = [];
        for (var i = 0; i < this._controls.length; i++) {
            if (this._controls[i].class === controlClass && this._controls[i][property] === value) {
                controls.push(this._controls[i]);
            }
        }
        return controls;
    },
    isParentControl: function (controlParent, controlChild) {
        var result = controlChild && controlParent &&
            controlChild.x >= controlParent.x &&
            controlChild.y >= controlParent.y &&
            controlChild.x + controlChild.width <= controlParent.x + controlParent.width &&
            controlChild.y + controlChild.height <= controlParent.x + controlParent.height;
        return result;
    }

};

var prompts = {
    _promptsJSON: {},
    getPrompt: function (appName, promptId, language) {
        var self = this;
        if (!this._promptsJSON[appName]) {
            $.ajax({
                type: "GET",
                url: '/cgi-bin/file/get?path=' + appName + '/resources/prompts.json',
                contentType: "text/json",
                dataType: "json",
                async: false,
                success: function (data) {
                    self._promptsJSON[appName] = data;
                }
            });
        }
        var translatedText;
        if (self._promptsJSON[appName]) {
            translatedText = self._promptsJSON[appName].language[language][promptId];
        } else {
            console.error('Unabe to get prompts.json path=%s/resources/prompts.json', appName);
        }
        return translatedText || null;
    },
    getDefaultLangPrompt: function (appName, promptId) {
        var self = this;
        if (!this._promptsJSON[appName]) {
            $.ajax({
                type: "GET",
                url: '/cgi-bin/file/get?path=' + appName + '/resources/prompts.json',
                contentType: "text/json",
                dataType: "json",
                async: false,
                success: function (data) {
                    self._promptsJSON[appName] = data;
                }
            });
        }
        var translatedText;
        if (self._promptsJSON[appName]) {
            var language = self._promptsJSON[appName].defaultLanguageCode;
            if (language) {
                translatedText = self._promptsJSON[appName].language[language][promptId];
            } else {
                console.error('defaultLanguageCode does not exists in prompts.json path=%s/resources/prompts.json', appName);
            }
        } else {
            console.error('Unabe to get prompts.json path=%s/resources/prompts.json', appName);
        }
        return translatedText || null;
    }
}

var system = {
    getSecureBackgroundPath: function (backgroundName) {
        var deferred = $.Deferred();

        var applicationName = registry.getValue('simCurrAppName');
        var localResourcesRequest = $.ajax({
            type: "GET",
            url: '/cgi-bin/sdk/file/get?path=applications/' + applicationName + '/resources/resources.xml',
            contentType: "text/xml",
            dataType: "xml",
        });
        var appResourcesRequest = $.ajax({
            type: "GET",
            url: '/cgi-bin/sdk/resource/xmlListApp',
            contentType: "text/xml",
            dataType: "xml",
        });

        $.when.apply($, [appResourcesRequest, localResourcesRequest]).then(function () {
            var backgroundPath, resourceFound = false;
            for (var i = 0; i < arguments.length; i++) {
                var xmlDoc = $.parseXML(arguments[i][2].responseText);
                $(xmlDoc).find('resource').each(function () {
                    var resourceName = $(this).attr('name');
                    var resourceType = ($(this).attr('type')).toString().toLocaleLowerCase();
                    if (resourceType === 'background' && resourceName === backgroundName) {
                        applicationName = i == 0 ? $(this).parent()[0].nodeName : applicationName;
                        resourceFound = true;
                        backgroundPath = i == 0 ? '/cgi-bin/file/get?path=' + applicationName + '/resources/' + $(this).attr('path') : '/cgi-bin/sdk/file/get?path=applications/' + applicationName + '/resources/' + $(this).attr('path');
                        return false;
                    }
                });
                if (resourceFound) {
                    break;
                }
            }
            resourceFound ? deferred.resolve(backgroundPath) : deferred.resolve(undefined);
        });
        return deferred.promise();
    }
};

function getQueryString(field, url) {
    var href = url ? url : window.location.href;
    var reg = new RegExp('[?&]' + field + '=([^&#]*)', 'i');
    var string = reg.exec(href);
    return string ? string[1] : null;
};

function createSimDomElement(control) {
    var id = sim_dom_elems_prefix + control.name;
    if (control.returnText) id += control.returnText;
    control.id = id;
    switch (control.class) {
        case 'pinblock': {
            $("body").append("<input type='text' id='" + id + "' style='position: absolute; left: " + control.x + "px; top: " + control.y + "px; width: " + control.width + "px; height: " + control.height + "px; z-index: 16777271;'>");
            $("#" + id).on('keypress', function (e) {
                if (e.which === 13) {
                    pinEntryCompletedCallback(true, true, pinTimeout === undefined, 'encrypted(' + $("#" + id).val() + ')');
                }
            });
            break;
        }
        case 'textbox': {
            $("body").append("<input type='text' id='" + id + "' style='position: absolute; left: " + control.x + "px; top: " + control.y + "px; width: " + control.width + "px; height: " + control.height + "px; z-index: 16777271;'>");
            $("#" + id).on('keypress', function (e) {
                if (e.which === 13) {
                    secureInputCallbacks.forEach(function (callbackFn) {
                        var data = {};
                        data[control.name] = $("#" + id).val();
                        callbackFn(data);
                    });
                }
            });
            break;
        }
        case 'signedImage': {
            var deferred = $.Deferred();
            system.getSecureBackgroundPath(control.name).then(function (path) {
                var img = $('<img id="' + id + '" src="' + path + '" style="position: absolute; left: ' + control.x + 'px; top: ' + control.y + 'px;" />').on('load', function () {
                    $('body').append(img);
                    control.width = $(this).width();
                    control.height = $(this).height();
                    deferred.resolve();
                });
            });
            control.promise = deferred.promise();
            break;
        }
        case 'signature': {
            var base64EncodedImg = 'data:image/png;base64,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';
            control.returnText = base64EncodedImg;
            $("body").append(
                "<div id='" + id + "' style='position: absolute; left: " + control.x + "px; top: " + control.y + "px; z-index: 16777271; width: " + control.width + "px; height: " + control.height + "px;'>" +
                "<div style='position: absolute; top: 0; right: 0; width: 20px; height: 20px; z-index: 16777272; border: 2px solid #ffffff; background-color: " + intToRgbString(control.color) + ";'></div>" +
                "<img src='" + base64EncodedImg + "' width='" + control.width + "' style='display: none; '>" +
                "<div style='position: absolute;bottom: 0; right: 0; background-color: #fff; color: #a0a0a0;'>Click anywhere on signature control to simulate signature</div><" +
                "/div>"
            );
            $("#" + id).on('click', function () {
                //display signature inline image
                $("#" + id).find('img').show();
            });
            break;
        }
        case 'checkbox':
        case 'radiobox': {
            $("body").append("<div id='" + id + "' class='control-area' style='position: absolute; z-index: 16777271; left: " + control.x + "px; top: " + control.y + "px; width: " + control.width + "px; height: " + control.height + "px;'>");
            if (control.onTouchImg) {
                system.getSecureBackgroundPath(control.onTouchImg).then(function (path) {
                    $("body").append("<img id='" + id + "-onTouchImg' src='" + path + "' style='position: absolute; left: " + control.x + "px; top: " + control.y + "px; z-index: 16777270; " + (control.checked == 0 ? "display:none" : "") + "'>");
                    registerOnClick(control.class, id, control.name, control.returnText, control.onTouchImg);
                });
            } else {
                registerOnClick(control.class, id, control.name, control.returnText, control.onTouchImg);
            }
            break;
        }
        case 'touchArea': {
            $("body").append("<div id='" + id + "' class='control-area' style='position: absolute; left: " + control.x + "px; top: " + control.y + "px; width: " + control.width + "px; height: " + control.height + "px; z-index: 16777271;'></div>");
            var signedImageControl = controls.findControlByClass('signedImage');
            var signatureControl = controls.findControlByClass('signature');
            if (signedImageControl && signatureControl) {
                signedImageControl.promise.then(function () {
                    //wait to update signedImageControl width and height
                    if (controls.isParentControl(signedImageControl, signatureControl) && controls.isParentControl(signedImageControl, control)) {
                        registerOnClick(signatureControl.class, id, signatureControl.name, signatureControl.returnText);
                    } else {
                        console.error('touchArea and/or signature control is not inside signed image control.');
                        return;
                    }
                    registerOnClick(control.class, id, control.name, control.text, control.onTouchImg);
                });
            } else if (control.class === 'touchArea' && signatureControl) {
                console.error('signature control is not inside signed image control.');
                return;
            }
            else {
                registerOnClick(control.class, id, control.name, control.text, control.onTouchImg);
            }
            break;
        }
    }

}
function registerOnClick(controlClass, id, name, returnText, onTouchImg) {
    var control = controls.findControlById(id);
    console.debug('register click event for control %s id=%s name=%s', controlClass, id, name);
    $("#" + id).on('click', function () {
        switch (controlClass) {
            case 'checkbox': {
                $("#" + id + "-onTouchImg").toggle();
                if (control.checked == 1) {
                    control.checked = 0;
                    returnText = control.returnText;
                } else {
                    control.checked = 1;
                    returnText = control.returnTextOn;
                }
                break;
            }
            case 'radiobox': {
                var radioGroupControls = controls.findControlsByClassAndPropertyValue('radiobox', 'name', control.name);
                for (var i = 0; i < radioGroupControls.length; i++) {
                    $("#" + radioGroupControls[i].id + "-onTouchImg").hide();
                }
                $("#" + id + "-onTouchImg").show();
                break;
            }
            case 'touchArea': {
                if (onTouchImg) {
                    $("#" + id + "-onTouchImg").show();
                    setTimeout(function () {
                        $("#" + id + "-onTouchImg").hide();
                    }, 1000);
                }
                break;
            }
        }

        secureInputCallbacks.forEach(function (callbackFn) {
            var data = {};
            data[name] = returnText;
            callbackFn(data);
        });

    });
}

/*** todo - missing in jphoenix.js ***/
function promptPinBlock(x, y, width, height, secureFont, fgColor, bgColor, overallTimeout, interCharacterTimeout, allowPinBypass) {
    console.log('promptPinBlock', x, y, width, height, secureFont, fgColor, bgColor, overallTimeout, interCharacterTimeout, allowPinBypass);
}

function promptMsr() {
    console.log('promptMsr');
}

/*
 * External debugging support
 */

function sendEventToTerminal(type, data) {
    //data should be XML
    var xmlRequestObject = "<__ext_debugger><event type='" + type + "'>" + data + "</event></__ext_debugger>";
    $.ajax({
//        url: _terminalBaseUrl + "page/update",
        url: "/cgi-bin/page/update",
        type: "POST",
        data: xmlRequestObject,
        contentType: "text/xml",
        dataType: "text",
        async: true,
        success: function () {
        }
    });
}

function processExtDebuggerEvents(data) {

    //sometimes multiple independant events comes at once. have to add root element, so that XML parser doesn't complain.
    data = "<events>" + data + "</events>";
    var $xml;
    try {
        var xmlDoc = $.parseXML(data);
        $xml = $(xmlDoc);
    } catch (e) {
        console.error("processExtDebuggerEvents:, error parsing received data,  data: " + data + ", exception message: " + e.message);
        return;
    }
    var $event = $xml.find("event");
    if ($event.length > 0) {
        $event.each(function () {
            var event = $(this);
            var type = event.attr("type");

            if (type === "pageUpdated") {
                var cdata = event.text();
                console.log("processExtDebuggerEvents: processing pageUpdated event, cdata: " + cdata + ", count pageUpdateCallbacks: " + pageUpdateCallbacks.length);
                pageUpdateCallbacks.forEach(function (callback) {
                    console.log("processExtDebuggerEvents:, invoking pageUpdateCallback, callback: " + callback);
                    callback(cdata);
                });
            } else if (type === "variableChanged") {
                var varName = event.find("varName").text();
                var varValue = event.find("varValue").text();
                console.log("processExtDebuggerEvents:, processing variableChanged event, varName: " + varName + ", varValue: " + varValue);
                registry._valueChangedCallbacks.forEach(function (callback) {
                    console.log("processExtDebuggerEvents:, invoking variableChangedCallback, callback: " + callback);
                    callback(varName, varValue);
                });
            } else {
                console.log("processExtDebuggerEvents:, unknown type received, type: " + type);
            }
        })
    }
}

function waitForExtDebuggerEvents() {
    $.ajax({
//        url: _terminalBaseUrl + 'page/event',
        url: '/cgi-bin/page/event',
        contentType: 'text/xml',
        success: function (response) {

            try {
                //analyze event;
                processExtDebuggerEvents(response);
            } catch(e) {
                console.error("waitForExtDebuggerEvents:, processExtDebuggerEvents, exception message: " + e.message);
            }

            //initiate next wait
            waitForExtDebuggerEvents();
        }
    });
}


$(window).on("load", function () {
    //open page on terminal

    /*
     *   NOTE: IT IS MANDATORY to have page support page loaded before page starts
     */

    var extDebuggerSupportPagePath = "sdk/pagesExtDebuggingSupport/pagesExternalDebuggingSupport.html";

    if (window.parent.useExternalTerminal === "true") {
        $.get('/cgi-bin/page/show', {path: extDebuggerSupportPagePath}, function (data) {
            //initiate waiting for events on page load
            waitForExtDebuggerEvents();

            //initiate page controls
            initPageControls();
        });
    } else {
        initPageControls();
    }
});

