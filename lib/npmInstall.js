var path = requie('path');
var fs = require('fs');

module.exports = function(context) {
    var Q = context.requireCordovaModule('q');
    var npm = context.requireCordovaModule('npm');

    var package = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
    return Q.ninvoke(npm, 'load').then(function() {
        return Q.ninvoke(npm.commands, 'install', package.dependencies.map(function(p) {
            return p + '@' + package.dependencies[p];
        }));
    });
};
