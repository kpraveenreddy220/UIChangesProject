//var terminalHostname = "http://localhost";
var terminalHostname = "http://192.168.152.3";

$(document).ready(function() {
    var sidebarMainMenu = $('#sidebar-menu .main-menu');
    var staticContent = $('#static-content');
    staticContent.find('h1').each(function() {
        sidebarMainMenu.append('<li id="'+ $(this).attr('id') + '-menu"><a href="#' + $(this).attr('id') + '">' + $(this).html() + '</li>');
        title = sidebarMainMenu.find('#' + $(this).attr('id'));
    });
    staticContent.find('h2').each(function() {
        prevTitle = sidebarMainMenu.find('#' + $(this).prevAll('h1').first().attr('id') + '-menu');
        prevTitle.not(":has(ul)").append('<ul class="sub-menu"></ul>');
        prevTitle.find('.sub-menu').append('<li id="'+ $(this).attr('id') + '-menu"><a href="#' + $(this).attr('id') + '">' + $(this).html() + '</li>');
    });
    sidebarMainMenu.affix({
        offset: {
            top: 0  // To Modify according to the height offset
        }
    });
});


function doHighlight() {
    var highlight = ace.require("ace/ext/static_highlight");
    var dom = ace.require("ace/lib/dom");
    function qsa(sel) {
        return Array.apply(null, document.querySelectorAll(sel));
    }
    qsa(".highlight-code").forEach(function (codeEl) {
        highlight(codeEl, {
            mode: codeEl.getAttribute("ace-mode"),
            theme: codeEl.getAttribute("ace-theme"),
            startLineNumber: 1,
            showGutter: codeEl.getAttribute("ace-gutter"),
            trim: true
        }, function (highlighted) {

        });
    });
}

function doHighlightByIds(idsArray) {
    var highlight = ace.require("ace/ext/static_highlight");
    var dom = ace.require("ace/lib/dom");
    function qsa(sel) {
        return Array.apply(null, document.querySelectorAll(sel));
    }
    for(var i = 0 ; i < idsArray.length ; i++) {
        var id = idsArray[i];
        qsa("#" + id).forEach(function (codeEl) {
            highlight(codeEl, {
                mode: codeEl.getAttribute("ace-mode"),
                theme: codeEl.getAttribute("ace-theme"),
                startLineNumber: 1,
                showGutter: codeEl.getAttribute("ace-gutter"),
                trim: true
            }, function (highlighted) {

            });
        });
    }
}

function parseXML(data) {
    var $xml;
    try {
        var xmlDoc = $.parseXML(data);      //parse string into XML document
        $xml = $(xmlDoc);                   //convert XML document into jQuery object
        return $xml;
    } catch (e) {
        console.error("parseXML:, error parsing data,  data: " + data + ", exception message: " + e.message);
        return null;
    }
}

//implemented to accept multiple types at once. 
function fileDir(path, type, cb) {
    var applicationNames = [];
    $.ajax({
        type : "GET",
        url: terminalHostname + "/cgi-bin/file/dir",
        data: {"path": path},
        dataType: "xml",
        success : function(response) {
            var apps = response.getElementsByTagName(type);
            for(var d = 0 ; d < apps.length ; d++) {
                var appName = apps[d].innerHTML;
                applicationNames.push(appName);
            }
            cb(applicationNames, response);
        }
    });
}

function openHome() {

}

function openAboutWindow() {
    $.get("/html/sdk/sdkVersionDlg.mst.html", function(template) {
        $.ajax({
            type: "GET",
            url: terminalHostname + "/cgi-bin/platform/sysinfo",
            contentType: "text/json",
            success: function(data) {
                var rendered = Mustache.render(template, {sdkVersion: data.platform.sdk});
                $("body").append(rendered);
                $("#infoModal").modal("show").on("hidden.bs.modal", function(e) {
                    $("#infoModal").remove();
                });
            }
        });
    });
}

function openAboutFullWindow() {
    $.get("/html/sdk/allVersionsDlg.mst.html", function(template) {
        $.ajax({
            type: "GET",
            url: terminalHostname + "/cgi-bin/platform/sysinfo",
            contentType: "text/json",
            success: function(data) {
                var platformVers = [];
                $.each( data.platform, function( key, value ) {
                    platformVers.push({name: key, value: value});
                });
                var appVers = [];
                $.each( data.apps, function( key, value ) {
                    appVers.push({name: key, value: value});
                });
                var rendered = Mustache.render(template, {platformVers: platformVers, appVers: appVers});
                $("body").append(rendered);
                $("#infoModal").modal("show").on("hidden.bs.modal", function(e) {
                    $("#infoModal").remove();
                });
            }
        });
    });
}

function gotoAppBuilder() {
    $.get( '/cgi-bin/page/show',
        {
            path: 'sdk/pagebuildersplash.html'
        }, "html"
    );
//      window.location.href = "/html/sdk/pagebuilder";
    window.open("/html/sdk/pagebuilder", '_blank', 'location=yes,height=800,width=1280,scrollbars=no,status=no');
}
function gotoKeyboardDesigner() {
    $.get( '/cgi-bin/page/show',
        {
            path: 'sdk/keyboarddesignersplash.html'
        }, "html"
    );
    window.open("/html/sdk/keyboarddesigner", '_blank', 'location=yes,height=800,width=1280,scroll')
}

function htmlEscape(str) {
	return String(str)
	  .replace(/&/g, '&amp;')
	  .replace(/"/g, '&quot;')
	  .replace(/'/g, '&#39;')
	  .replace(/</g, '&lt;')
	  .replace(/>/g, '&gt;');
}
