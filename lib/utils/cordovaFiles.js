var path = require('path');
var fs = require('fs');
var url = require('url');

var glob = require('glob');
var et = require('elementtree');
var cheerio = require('cheerio');
var Policy = require('csp-parse');
var plist = require('plist');

var WWW_FOLDER = {
    android: '/platforms/android/assets/www',
    ios: '/platforms/ios/www'
};

var CONFIG_LOCATION = {
    android: 'platforms/android/res',
    ios: 'platforms/ios'
};

function parseXml(filename) {
    return new et.ElementTree(et.XML(fs.readFileSync(filename, "utf-8").replace(/^\uFEFF/, "")));
}

function addCSP(htmlFile) {
    var pageContent = fs.readFileSync(htmlFile, 'utf-8');

    var $ = cheerio.load(pageContent, {
        decodeEntities: false
    });
    var cspTag = $('meta[http-equiv=Content-Security-Policy]');
    var policy = new Policy(cspTag.attr('content'));
    policy.add('default-src', 'ws:');
    policy.add('default-src', "'unsafe-inline'");
    cspTag.attr('content', function() {
        return policy.toString();
    });

    fs.writeFileSync(htmlFile, $.html());
    return htmlFile;
}

function changeConfigXml(hostedPage, filename) {
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
}

function fixATS(filename) {
    var data = plist.parseFileSync(filename);
    data.NSAppTransportSecurity = {
        NSAllowsArbitraryLoads: true
    };
    fs.writeFileSync(filename, plist.build(data));
    return filename;
}


/**
 * Cordova is usually served from index.html on the device. This function changes that to be served from a server instead
 * @param server - The location:host of the server where the hosted page is served from
 * @param projectRoot - Optional root of the Cordova project, should have a platforms directory. Defaults to current directory
 * @param platforms - Options array of platforms whose config.xml should be changed. Defaults to ['ios', 'android']
 **/
module.exports = {
    changeStartPage: function(server, projectRoot, platforms) {
        platforms = platforms || ['android', 'ios'];
        projectRoot = projectRoot || '.';

        platforms.map(function(platform) {
            // Update config.xml files
            var files = glob.sync('**/config.xml', {
                cwd: path.join(projectRoot, CONFIG_LOCATION[platform]),
                ignore: 'build/**'
            });
            if (files.length > 0) {
                var startPage = url.resolve(server, WWW_FOLDER[platform] + '/index.html');
                changeConfigXml(startPage, path.join(projectRoot, CONFIG_LOCATION[platform], files[0]));
            }

            // Add CSP to index.html for each platform
            var indexFile = path.join(projectRoot, WWW_FOLDER[platform], 'index.html');
            if (fs.existsSync(indexFile)) {
                addCSP(indexFile);
            }

            // Fix ATS
            if (platform === 'ios') {
                var plist = glob.sync('**/*.*Infp.plist', {
                    cwd: path.join(projectRoot, CONFIG_LOCATION[platform]),
                    ignore: 'build/**'
                });
                if (plist.length > 0) {
                    fixATS(path.join(projectRoot, CONFIG_LOCATION[platform], plist[0]));
                }
            }
        });
    },
    configXml: CONFIG_LOCATION,
    www: WWW_FOLDER
}
