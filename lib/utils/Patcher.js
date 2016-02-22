var path = require('path');
var fs = require('fs');
var url = require('url');

var glob = require('glob');
var et = require('elementtree');
var cheerio = require('cheerio');
var Policy = require('csp-parse');
var plist = require('plist');
var browserSyncPrimitives = require('cordova-browsersync-primitives');


var WWW_FOLDER = {
    android: 'assets/www',
    ios: 'www'
};

var START_PAGE = 'browser-sync-start.html';

function parseXml(filename) {
    return new et.ElementTree(et.XML(fs.readFileSync(filename, "utf-8").replace(/^\uFEFF/, "")));
}

function Patcher(projectRoot, platforms) {
    this.projectRoot = projectRoot || '.';
    if (typeof platforms === 'string') {
        platforms = platforms.split(',');
    }
    this.platforms = platforms || ['android', 'ios'];

}

Patcher.prototype.__forEachFile = function(pattern, location, fn) {
    this.platforms.forEach(function(platform) {
        glob.sync(pattern, {
            cwd: path.join(this.projectRoot, 'platforms', platform, location[platform]),
            ignore: '*build/**'
        }).forEach(function(filename) {
            filename = path.join(this.projectRoot, 'platforms', platform, location[platform], filename);
            fn.apply(this, [filename, platform]);
        }, this);
    }, this);
};

Patcher.prototype.addCSP = function() {
    this.platforms.forEach(function(platform) {
        var platWWWFolder = browserSyncPrimitives.getWWWFolder(platform);
        var platformIndexLocal = path.join(this.projectRoot, platWWWFolder, 'index.html');
        browserSyncPrimitives.addCSP(platformIndexLocal);
    });
};

Patcher.prototype.copyStartPage = function(servers) {
    var html = fs.readFileSync(path.join(__dirname, 'browser-sync-start.html'), 'utf-8');
    this.__forEachFile('**/index.html', WWW_FOLDER, function(filename, platform) {
        var dest = path.join(path.dirname(filename), START_PAGE);
        var data = {};
        for (var key in servers) {
            if (typeof servers[key] !== 'undefined') {
                data[key] = url.resolve(servers[key], this.getWWWFolder(platform) + '/index.html');
            }
        }
        fs.writeFileSync(dest, html.replace(/__SERVERS__/, JSON.stringify(data)));
        // console.log('Copied start page ', servers);
    });
};

Patcher.prototype.updateConfigXml = function() {
    this.platforms.forEach(function(platform) {
        var platWWWFolder = browserSyncPrimitives.getWWWFolder(platform);
        var platformIndexLocal = path.join(this.projectRoot, platWWWFolder, 'index.html');
        browserSyncPrimitives.updateConfigXml(this.projectRoot, platform, this.getProjectName(), START_PAGE);
    });
};

// config.xml can be found in the projectRoot directory
Patcher.prototype.getConfigXMLFilename = function() {
    return path.join(this.projectRoot, 'config.xml');
};

// Retrieve the start page for a cordova project, given the project's root directory
Patcher.prototype.getProjectName = function() {
    var parsedConfigXML = parseXml(this.getConfigXMLFilename());
    var nameTag = parsedConfigXML.find('name');
    return nameTag.text;
};

Patcher.prototype.patch = function(opts) {
    opts = opts || {};
    this.copyStartPage(opts.servers);
    this.updateConfigXml();
    if (this.platforms.indexOf('ios') != -1)
        browserSyncPrimitives.fixATS(this.projectRoot, this.getProjectName());
    this.addCSP();
};

Patcher.prototype.getWWWFolder = function(platform) {
    return path.join('platforms', platform, WWW_FOLDER[platform]);
};

module.exports = Patcher;
