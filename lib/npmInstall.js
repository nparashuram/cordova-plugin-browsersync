module.exports = function(context) {
	var Q = context.requireCordovaModule('q');
	return Q.ninvoke(npm, 'load').then(function() {
		return Q.ninvoke(npm.commands, 'install', ['browser-sync']);
	});
};
