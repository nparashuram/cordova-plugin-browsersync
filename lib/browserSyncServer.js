var path = require('path');
var fs = require('fs');
var Url = require('url');

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
 * @param {Object} opts - Options to be passed to server 
 * @param {String} opts.projectRoot - The root of the Cordova project
 * @param {Function} opts.onFileChange - Function to be called when a file is changed
 * @param {Function} cb - A callback when server is ready, calls with (err, servr_hostname)
 */
module.exports = function(opts, cb) {
    var www = path.join(opts.projectRoot, 'www/');
    var bs = require('browser-sync').create();

    bs.watch(www + '**/*.*', {
        ignored: www + '/' + opts.ignore
    }, function(event, files) {
        if (event !== 'change') {
            return;
        }
        if (typeof opts.onFileChange !== 'function' || opts.onFileChange(event, files) !== false) {
            bs.reload(files);
        }
    });

    bs.init({
        server: {
            baseDir: opts.projectRoot,
            directory: true
        },
        open: false,
        snippetOptions: {
            rule: {
                match: /<\/body>/i,
                fn: function(snippet, match) {
                    return monkeyPatch() + snippet + match;
                }
            }
        },
        minify: false
    }, function(err, bs) {
        var server = bs.options.getIn(['urls', 'external']);
        cb(err, server);
    });
};
