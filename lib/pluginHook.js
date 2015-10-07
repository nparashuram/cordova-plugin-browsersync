var path = require('path');

function parseOptions(opts) {
    var result = {};
    opts.forEach(function(opt) {
        var parts = opt.split(/=/);
        result[parts[0].replace(/^-+/, '')] = parts[1] || true;
    });
    return result;
}

module.exports = function(context) {
    var options = parseOptions(context.opts.options);

    if (typeof options['live-reload'] === 'undefined') {
        return;
    }

    var cordovaFiles = require('./utils/cordovaFiles');
    var browserSyncServer = require('./utils/browserSyncServer');

    var bs = browserSyncServer(function(defaults) {
        defaults.files.push({
            match: ['www/**/*.*'],
            fn: function(event, file) {
                console.log(event, file);
                if (event === 'change') {
                    context.cordova.prepare();
                    bs.reload();
                }
            }
        });
        return defaults;

    }, function(err, server) {
        cordovaFiles.changeStartPage(server, context.opts.projectRoot, ['android', 'ios']);
    }, context.opts.projectRoot);
}
