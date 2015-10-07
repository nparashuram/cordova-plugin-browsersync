var path = require('path');
var fs = require('fs');

var BrowserSync = require('browser-sync');

var cordovaFiles = require('./cordovaFiles');

/**
 * Private function that adds the code snippet to deal with reloading
 * files when they are served from platform folders
 */
function monkeyPatch() {
    var script = function() {
        window.__karma__ = true;
        (function patch() {
            if (typeof window.__bs === 'undefined') {
                window.setTimeout(patch, 500);
            } else {
                var oldCanSync = window.__bs.prototype.canSync;
                window.__bs.prototype.canSync = function(data, optPath) {
                    data.url = window.location.pathname.substr(0, window.location.pathname.indexOf('/www')) + data.url.substr(data.url.indexOf('/www'))
                    return oldCanSync.apply(this, [data, optPath]);
                };
            }
        }());
    };
    return '<script>(' + script.toString() + '());</script>';
}

/**
 * Starts the browser sync server, and when files are changed, does the reload
 * @param {Object} opts - Options Object to be passed to browserSync. If this is a function, the function is called with default values and should return the final options to be passed to browser-sync
 * @param {Function} cb - A callback when server is ready, calls with (err, servr_hostname)
 * @param projectRoot - Optional root of the Cordova project, should have a platforms directory. Defaults to current directory
 */
module.exports = function(opts, cb, projectRoot) {
    projectRoot = projectRoot || '.';
    opts = opts || {};
    var bs = BrowserSync.create();

    var defaults = {
        open: false,
        snippetOptions: {
            rule: {
                match: /<\/body>/i,
                fn: function(snippet, match) {
                    return monkeyPatch() + snippet + match;
                }
            }
        },
        minify: false,
        server: {
            baseDir: projectRoot,
            routes: {
                cordovaFiles.www.android: path.join(projectRoot, cordovaFiles.www.android),
                    cordovaFiles.www.ios: path.join(projectRoot, cordovaFiles.www.ios)
            }
        },
        files: [{
            match: ['www/**/*.*'],
            fn: function(event, file) {
                if (event === 'change') {
                    bs.reload(file)
                }
            }
        }]
    };

    if (typeof opts === 'function') {
        opts = opts(defaults);
    } else {
        for (var key in defaults) {
            if (typeof opts[key] === 'undefined') {
                opts[key] = defaults[key];
            }
        }
    }

    bs.init(opts, function(err, bs) {
        var server = bs.options.getIn(['urls', 'external']);
        cb(err, server);
    });
};
