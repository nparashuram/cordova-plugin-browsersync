/**
 * Cordova is usually served from index.html on the device. This function serves changes that to be served from a server instead
 * @param configLocation - The place where platform specific config.xml is located, relative to platforms folder
 * @param hostedPage - Location from where the www/index.html file should be served, relative to platforms folder
 **/

var path = require('path');
var fs = require('fs');

module.export = function(context) {

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

	return function(hostedPage, cwd) {
		return configs = glob.sync('**/config.xml', {
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
};