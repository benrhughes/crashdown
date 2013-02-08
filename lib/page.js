exports.page = page;
exports.pages = pages;
exports.listAll = listAll;
exports.populateCache = populateCache;
exports.watchCache = watchCache;

var config = require('../config.json');

var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var markdown = require('marked');
var glob = require('glob');
var watchr = require('watchr');
var moment = require('moment');

var pagesCache = [];
var updatingCache = false;

// constants
var pagesDir = 'pages';
var jsonExt  = '.json';
var mkdExt = '.mkd';
var partials = { head : 'head', foot : 'foot', prevnext : 'prevnext'}

function pages(res, basePath, pagesToDisplay){
	var numPages = 2;
	var first = numPages * pagesToDisplay;
	var last = Math.min(pagesCache.length, first + numPages);

	var info = {};
	info.site = config.site;
	info.partials = _.clone(partials);
	info.pages = [];

	function createCallback(page){
		return function(err, data){
			if(err)
				return console.log(err);

			var p = _.clone(page);
			p.body = markdown(data);
			info.pages.push(p);	
			
			if(info.pages.length == last - first){
				if(first > 0)
					info.prev = '/pages/' + (parseInt(pagesToDisplay)-1);

				if(last < pagesCache.length)
					info.next = '/pages/' + (parseInt(pagesToDisplay)+1);

				res.render('pages', info);
			}
		}
	}

	for(var i = first; i < last; i++){
		var page = pagesCache[i];
		
		if(!page)
			continue;

		load(path.join(basePath, pagesDir, page.path), createCallback(page) );
	}
}

function listAll(res, basePath){
	var info = {};
	info.site = config.site; 
	info.title = 'All Pages';
	info.pages = pagesCache;
	info.partials = _.clone(partials);

	_.each(info.pages, function(page){
		if(page.date)
			page.pubDate = moment(page.date).format('MMMM Do, YYYY'); 
	});

	res.render('all', info);
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
				
				if(page.date)
					page.date = Date.parse(page.date);
			
				page.path = file.replace(jsonExt,'');
				pagesCache.push(page);

				if(pagesCache.length == files.length){
					pagesCache = _.sortBy(pagesCache, function(p){ 
						return p.date ? -p.date : 0;
					});
					updatingCache = false;
				}
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

function page(res, basePath, localPath, fileName){
	var fullpath = path.join(basePath, pagesDir, localPath, fileName);

	var jsonPath = path.join(localPath, fileName);
	
	var info = _.find(pagesCache, function(page){ return page.path == jsonPath;});
	if(!info)
		return res.send('Not Found', 404);

	info.site = config.site;

	if(info.date)
		info.pubDate = moment(info.date).format('MMMM Do, YYYY'); 

	load(fullpath, function(err, data){
		if(err)
			return res.send(err, 500);

		info.body = markdown(data);
		info.partials = _.clone(partials);

		res.render('page', info);
	});
}

//callback(err, data)
function load(fullpath, callback){
	console.log('Loading ' + fullpath);

	var mkdPath = fullpath + mkdExt;
	
	fs.exists(mkdPath, function(exists){
		if(!exists)
			return callback("Body not found"); 

		fs.readFile(mkdPath, 'utf8', function(err,data){
			if(err)
				return callback(err); 

			callback(null, data);
		});
	});
}

