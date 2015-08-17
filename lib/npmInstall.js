module.exports = function(context) {
	var Q = context.requireCordovaModule('q');

	return Q.promise(function(resolve, reject, notify) {
		try {
			require('browser-sync');
			resolve();
		} catch (e) {
			resolve(function() {
				var npm = context.requireCordovaModule('npm');
				return Q.ninvoke(npm, 'load').then(function() {
					return Q.ninvoke(npm.commands, 'install', ['browser-sync']);
				});
			});
		}
	});
};