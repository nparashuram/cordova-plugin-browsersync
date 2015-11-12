var path = require('path');
var glob = require('glob');

var Patcher = require('./utils/Patcher');
var browserSyncServer = require('./utils/browserSyncServer');

function parseOptions(opts) {
    var result = {};
    opts = opts || [];
    opts.forEach(function(opt) {
        var parts = opt.split(/=/);
        result[parts[0].replace(/^-+/, '')] = parts[1] || true;
    });
    return result;
}

module.exports = function(context) {
    var options = parseOptions(context.opts.options.argv);

    if (typeof options['live-reload'] === 'undefined') {
        return;
    }

    // TODO - Add back ignored option
    // TODO - Enable live reload servers

    var platforms = ['android', 'ios'];
    var patcher = new Patcher(context.opts.projectRoot, platforms);

    var bs = browserSyncServer(function(defaults) {
        defaults.files.push({
            match: ['www/**/*.*'],
            fn: function(event, file) {
                if (event === 'change') {
                    context.cordova.raw.prepare().then(function() {
                        patcher.addCSP();
                        bs.reload();
                    });
                }
            }
        });

        defaults.server = {
            baseDir: platforms.map(patcher.getWWWFolder.bind(patcher)),
            routes: {}
        }

        platforms.forEach(function(platform) {
            var www = patcher.getWWWFolder(platform);
            defaults.server.routes['/' + www] = path.join(context.opts.projectRoot, www);
        });

        return defaults;
    }, function(err, servers) {
        patcher.patch({
            servers: servers
        });
    });
}
