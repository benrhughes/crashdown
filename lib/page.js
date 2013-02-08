exports.load = load;
exports.all = all;
exports.populateCache = populateCache;
exports.watchCache = watchCache;

var config = require('../config.json');

var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var markdown = require('marked');
var glob = require('glob');
var watchr = require('watchr');

var pagesCache = [];
var updatingCache = false;

// constants
var pagesDir = 'pages';
var jsonExt  = '.json';
var mkdExt = '.mkd';
var partials = { head : 'head', foot : 'foot'}

function index(res, basePath){
	//
}

function all(res, basePath){
	var info = {};
	info.site = config.site; 
	info.title = 'All Pages';
	info.pages = pagesCache;
	info.partials = _.clone(partials);

	res.render('pages', info);
}

function populateCache(basePath)
{
	if(updatingCache)
		return;

	updatingCache = true;
	pagesCache = [];

	glob('**/*.json', { cwd: path.join(basePath, pagesDir) }, function(err, files){
		_.each(files, function(file){
			fs.readFile(path.join(basePath, pagesDir, file), 'utf8', function(err, data){
				var page = JSON.parse(data);
				page.path = file.replace(jsonExt,'');
				pagesCache.push(page);

				if(pagesCache.length == files.length)
					updatingCache = false;
			});
		});
	});
}

function watchCache(basePath)
{
	watchr.watch({
		path: path.join(basePath, pagesDir),
		listeners: {
			change: function(){
				console.log('Change detected: invalidating cache');
				populateCache(basePath);
			}
		}
	});
}

//todo: use cache for json file
function load(res, basePath, localPath, fileName){
	var fullpath = path.join(basePath, pagesDir, localPath, fileName);

	var jsonPath = fullpath + jsonExt;
	var mkdPath = fullpath + mkdExt;

	fs.exists(jsonPath, function(exists){
		if(!exists)
			return res.send('Not Found', 404);

		fs.readFile(jsonPath, 'utf8',  function(err,data){
			if(err)
				return res.send(err, 500);

			var info = JSON.parse(data);
			info.site = config.site;

			fs.exists(mkdPath, function(exists){
				if(!exists)
					return res.send('Page body does not exist', 500);

				fs.readFile(mkdPath, 'utf8', function(err,data){
					if(err)
						return res.send(err, 500);

					info.body = markdown(data);
					info.partials = _.clone(partials);

					res.render('page', info);
				});
			});
		});
	});
}

