module.exports = function(context) {
	if (context.opts.options[0] === '--browser-sync-mode') {
		// Prepare was called by this script, so don't run the script again
		return;
	}

	var changeHost = require('./changeHost')(context);

	return context.requireCordovaModule('./browserSync').nfcall(require('./browserSync'), {
		onFileChange: function(event, files) {
			context.cordova.prepare({
				options: ['--browser-sync-mode'] // to indicate who is calling prepare
			});
		},
		projectRoot: context.opts.projectRoot
	}).then(function(err, server) {
		changeHost(server + 'platforms/android/assets/www/index.html', path.join(context.opts.projectRoot, 'platforms/android/res'));
		changeHost(server + 'platforms/ios/www/index.html', path.join(context.opts.projectRoot, 'platforms/ios'));
	});
}