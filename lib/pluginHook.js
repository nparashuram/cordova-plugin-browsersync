var Patcher = require('./utils/Patcher');
var cordovaBrowserSync = require('cordova-browsersync-primitives');

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

    var bs = cordovaBrowserSync.startBrowserSync(context.opts.projectRoot, platforms, function(defaults) {
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

        return defaults;
    }, function(err, browserSyncValue) {
        patcher.patch({
            servers: browserSyncValue.servers
        });
    });
}
