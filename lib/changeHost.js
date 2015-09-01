/**
 * Cordova is usually served from index.html on the device. This function changes that to be served from a server instead
 * @param projectRoot - The root of the Cordova project, should have a platforms directory
 * @param server - The location.host of the server where the hosted page is served from
 * @param platforms - An array of platforms whose config.xml should be changed. Defaults to ios and android
 * @param context - Optional argument. If passed, context.requireCordovaModule is used, else node's require statement is used to load dependencies
 * @returns Name of the config file that changed
 **/

var path = require('path');
var fs = require('fs');

module.exports = function(projectRoot, server, platforms, context) {
    platforms = platforms || ['android', 'ios'];
    context = context || {};
    if (typeof context.requireCordovaModule !== 'function') {
        context.requireCordovaModule = require;
    }

    var npm = context.requireCordovaModule('npm');
    var Q = context.requireCordovaModule('q');
    var glob = context.requireCordovaModule('glob')
    var et = context.requireCordovaModule('elementtree');

    function parseXml(filename) {
        return new et.ElementTree(et.XML(fs.readFileSync(filename, "utf-8").replace(/^\uFEFF/, "")));
    }

    function changeConfigXml(hostedPage, cwd) {
        return glob.sync('**/config.xml', {
            cwd: cwd
        }).map(function(filename) {
            var filename = path.join(cwd, filename);
            configXml = parseXml(filename);
            var contentTag = configXml.find('content[@src]');
            if (contentTag) {
                contentTag.attrib.src = hostedPage;
            }
            // Also add allow nav in case of 
            var allowNavTag = et.SubElement(configXml.find('.'), 'allow-navigation');
            allowNavTag.set('href', '*');
            fs.writeFileSync(filename, configXml.write({
                indent: 4
            }), "utf-8");
            return filename;
        });
    }

    var WWW_FOLDER = {
        android: '/platforms/android/assets/www/index.html',
        ios: '/platforms/ios/www/index.html'
    };

    var CONFIG_LOCATION = {
        android: 'platforms/android/res',
        ios: 'platforms/ios'
    }

    return platforms.map(function(platform) {
        return changeConfigXml(server + WWW_FOLDER[platform], path.join(projectRoot, CONFIG_LOCATION[platform]));
    });
};
