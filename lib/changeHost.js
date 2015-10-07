var path = require('path');
var fs = require('fs');

var Q = require('q');
var glob = require('glob')
var et = require('elementtree');
var cheerio = require('cheerio');

/**
 * Cordova is usually served from index.html on the device. This function changes that to be served from a server instead
 * @param server - The location:host of the server where the hosted page is served from
 * @param projectRoot - Optional root of the Cordova project, should have a platforms directory. Defaults to current directory
 * @param platforms - Options array of platforms whose config.xml should be changed. Defaults to ['ios', 'android']
 **/
module.exports = function(server, projectRoot, platforms) {
    platforms = platforms || ['android', 'ios'];
    projectRoot = projectRoot || '.';

    function parseXml(filename) {
        return new et.ElementTree(et.XML(fs.readFileSync(filename, "utf-8").replace(/^\uFEFF/, "")));
    }

    function addCSP(htmlFile) {
        var pageContent = fs.readFileSync(htmlFile, 'utf-8');

        var $ = cheerio.load(pageContent);
        var cspTag = $('meta[http-equiv=Content-Security-Policy]');
        var policy = new Policy(cspTag.attr('content'));
        policy.add('script-src', 'ws:');
        policy.add('script-src', 'unsafe-inline');
        cspTag.attr('content', policy.toString());

        fs.writeFileSync(htmlFile, $.html());
        return htmlFile;
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

    platforms.map(function(platform) {
        // Update config.xml files 
        changeConfigXml(server + WWW_FOLDER[platform], path.join(projectRoot, CONFIG_LOCATION[platform]));

        // Add CSP to index.html for each platform
        addCSP(path.join(projectRoot, WWW_FOLDER[platform]));
    });
};
