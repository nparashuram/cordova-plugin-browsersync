var path = require('path');

module.exports = function(context) {
    if (context.opts.options.indexOf('--live-reload') === -1) {
        return;
    }

    var Q = context.requireCordovaModule('q');

    var changeHost = require('./changeHost')(context);
    var bs = require('./browserSyncServer');

    var ignoreParam = context.opts.options.filter(function(option) {
        return option.indexOf('--ignore=') === 0
    });

    return Q.nfcall(bs, {
        onFileChange: function(event, files) {
            context.cordova.prepare();
        },
        projectRoot: context.opts.projectRoot,
        // Extract out the value for --ignore
        ignore: ignoreParam.length > 0 ? ignoreParam[0].split('=')[1] : ''
    }).then(function(server) {
        changeHost(server + '/platforms/android/assets/www/index.html', path.join(context.opts.projectRoot, 'platforms/android/res'));
        changeHost(server + '/platforms/ios/www/index.html', path.join(context.opts.projectRoot, 'platforms/ios'));
    });
}
