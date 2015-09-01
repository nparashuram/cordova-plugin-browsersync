module.exports = function(context) {
    if (context.opts.options.indexOf('--live-reload') === -1) {
        return;
    }
    var changeHost = require('./changeHost');
    var browserSyncServer = require('./browserSyncServer')

    var Q = context.requireCordovaModule('q');
    return Q.nfcall(browserSyncServer, {
        onFileChange: function(event, files) {
            context.cordova.prepare();
        },
        // Extract out the value for --ignore
        ignore: (function(options) {
            var ignoreParam = options.filter(function(option) {
                return option.indexOf('--ignore=') === 0
            });
            return ignoreParam.length > 0 ? ignoreParam[0].split('=')[1] : ''
        }(context.opts.options)),
        projectRoot: context.opts.projectRoot,
    }).then(function(server) {
        return changeHost(context.opts.projectRoot, server, ['android', 'ios'], context);
    });
}
