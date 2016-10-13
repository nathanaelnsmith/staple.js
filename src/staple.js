var Staple = (function () {

    /*
     *  Table of Contents
     *  -------------------------
     *  1. Framework Classes
     *    a. Router
     *  2. Library Classes
     *    a. Loader
     *    b. Api
     *  3. Utiltiy Methods
     *    a. serializeForm
     *    b. showErrors
     */

    /* ========================================================================
     * DOM-based Routing
     * Based on http://goo.gl/EUTi53 by Paul Irish
     *
     * Only fires on body classes that match. If a body class contains a dash,
     * replace the dash with an underscore when adding it to the object below.
     *
     * .noConflict()
     * The routing is enclosed within an anonymous function so that you can
     * always reference jQuery with $, even when in .noConflict() mode.
     * ======================================================================== */

    function Router(routes) {
        this.routes = routes;
    }

    Router.prototype.fire = function(func, funcname, args) {
        var fire;
        var namespace = this.routes;
        funcname = (funcname === undefined) ? 'init' : funcname;
        fire = func !== '';
        fire = fire && namespace[func];
        fire = fire && typeof namespace[func][funcname] === 'function';

        if (fire) {
            namespace[func][funcname](args);
        }
    };

    Router.prototype.loadEvents = function() {
        var route = this;
        // Fire common init JS
        route.fire('common');

        // Fire page-specific init JS, and then finalize JS
        $.each(document.body.className.replace(/-/g, '_').split(/\s+/), function(i, classnm) {
            route.fire(classnm);
            route.fire(classnm, 'finalize');
        });

        // Fire common finalize JS
        route.fire('common', 'finalize');
    };

    /*
     *  Author: Nathanael Smith
     *  Class: Loader
     *  Description: Creates a loader element in the context provided that can be stopped and started.
     */

    function Loader(params) {
        this.settings = {};
        $.extend(this.settings, params);
        this.settings.orig = this.settings.context.html();
        this.loader = $(this.settings.html);
        this.loading = 0;
    }

    Loader.prototype.start = function () {
        this.settings.context.html(this.loader);
        this.loading = 1;
    };

    Loader.prototype.pause = function () {
        this.loader.hide();
        this.loading = 0;
    };

    Loader.prototype.finish = function () {
        this.settings.context.html(this.settings.orig);
        this.loading = 0;
    };

    /*
     *  Author: Nathanael Smith
     *  Class: Api
     *  Description: Creates an API interface for common AJAX methods (get,post)
     */

    function Api(url, token, cors) {
        this.url = url;
        this.token = token || null;
        this.apiUrl = config.apiUrl;
        this.cors = cors || false;
        if (this.cors) {
            $.support.cors = true;
        }
    }

    Api.prototype.parseParams = function (params) {
        var paramReg = /(:[\S]+?)(?=\/|$)/g;
        return [this.url.replace(paramReg, function (match) {
            var param = match.substring(1),
                replacement = params[param];
            delete params[param];
            return replacement;
        }), params];
    };

    Api.prototype.get = function (data, callback) {
        callback = callback || function () { };
        var params = this.parseParams(data),
            token = this.token,
            that = this;

        return $.ajax({
            dataType: 'json',
            type: 'GET',
            crossDomain: true,
            url: this.apiUrl + params[0] + '?' + $.param(params[1]),
            contentType: 'application/javascript',
            headers: {
                'token': token
            },
            success: callback
        });
    };

    Api.prototype.post = function (data, callback) {
        callback = callback || function () { };
        var params = this.parseParams(data),
            token = this.token;

        return $.ajax({
            contentType: 'application/json',
            dataType: 'json',
            type: 'POST',
            data: JSON.stringify(params[1]),
            crossDomain: true,
            url: this.apiUrl + params[0],
            success: callback
        });
    };

    Api.prototype.getUrl = function (data, callback) {
        callback = callback || function () { };
        var params = this.parseParams(data),
            endPoint = params[0] + '?' + this.cleanParams($.param(params[1]));

        return this.apiUrl + endPoint;
    };

    Api.prototype.filter = function (res) {
        var filter = $.Deferred();

        if (res.success || res.Success) {
            filter.resolve(res);
        } else {
            filter.reject(res.error);
        }

        return filter.promise();
    };

    Api.prototype.cleanParams = function (queryString) {
        return queryString.replace(/%5B%5D/g, '');
    };

    /*
     *  Author: Nathanael Smith
     *  Class: ErrorBox
     *  Description: Creates an error box for pushing error messages into.
     */

    function ErrorBox (boxInject) {
        this.addBox(boxInject);
    }

    ErrorBox.prototype.addBox = function (boxInject) {
        this.box = $("<div />", {
            class: "error-box"
        });
        boxInject(this.box);
    };

    ErrorBox.prototype.showErrors = function (messages) {
        var box = this.box;
        box.empty();
        $.each(messages, function (id, message) {
            box.append('<p class="error-box__message">' + message + '</p>');
        });
    };

    /*
     *  Source: http://stackoverflow.com/a/17784656
     *  Description: Serializes form values into an array, then maps them to an object while concatinating existing properties.
     */

    function serializeForm (form, callback) {
        var data = {};
        callback = callback || function () {};
        $(form).serializeArray().map(function(x){
            data[x.name] = (data.hasOwnProperty(x.name)) ? data[x.name] + ',' + x.value : x.value;
        });
        callback(data);

        return data;
    }

    /*
     * Source: http://www.kevinleary.net/jquery-parse-url/
     * Description: Parses URL for specified param.
     */

    function urlQuery( query ) {
        query = query.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        var expr = "[\\?&]"+query+"=([^&#]*)";
        var regex = new RegExp( expr );
        var results = regex.exec( window.location.href );
        if ( results !== null ) {
            return results[1];
        } else {
            return false;
        }
    }


    return {
        serializeForm: serializeForm,
        ErrorBox: ErrorBox,
        urlQuery: urlQuery,
        Loader: Loader,
        Api: Api,
        Router: Router
    };

})();
