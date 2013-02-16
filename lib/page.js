exports.page = page;
exports.oldest = oldest;
exports.pages = pages;
exports.listAll = listAll;
exports.tag = tag;
exports.tags = tags;
exports.rss = rss;
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
var partials = { head : 'head', foot : 'foot', prevnext : 'prevnext', pagedata : 'pagedata'};

function pages(res, basePath, pageNum){
	var first = config.pagesToDisplay * pageNum;
	var last = Math.min(pagesCache.length, first + parseInt(config.pagesToDisplay));

	var model = {};
	model.site = config.site;
	model.partials = _.clone(partials);
	model.pages = [];
	model.tags = tags();

	function createCallback(page){
		return function(err, data){
			if(err)
				return console.log(err);

			var p = _.clone(page);
			p.body = markdown(data);
			if(p.date)
				p.pubDate = moment(p.date).format('MMMM Do, YYYY'); 

			model.pages.push(p);	
			
			if(model.pages.length == last - first){
				if(first > 0)
					model.prev = '/pages/' + (parseInt(pageNum)-1);

				if(last < pagesCache.length)
					model.next = '/pages/' + (parseInt(pageNum)+1);

				res.render('pages', model);
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
	getAll(basePath, function(model){
		res.render('all', model);
	});
}

function rss(res, basePath){
	getAll(basePath, function(model){
		res.type('application/xml');
		res.render('rss', model);		
	});
}

function getAll(basePath, callback){
	var model = {};
	model.site = config.site; 
	model.title = 'All Pages';
	model.pages = pagesCache;
	model.partials = _.clone(partials);
	model.tags = tags();

	_.each(model.pages, function(page){
		if(page.date)
			page.pubDate = moment(page.date).format('MMMM Do, YYYY'); 

		if(page.summary)
			page.body = markdown(page.summary);
	});
	
	callback(model);
}

function tags(res){
	if(!res)
		return;

	var t = _.uniq(_.flatten(_.map(pagesCache, function(page){
		return _.filter(page.tags, function(tag){ return tag});
	})));

	var model = {};
	model.site = config.site;
	model.title = 'Tags';
	model.tags = t;
	model.partials = _.clone(partials);

	res.render('tags', model);
}

function tag(res, tag){
	var model = {};
	model.site = config.site; 
	model.title = tag; 
	model.tags = tags();
	model.pages = _.filter(pagesCache, function(p){ 
		return p.tags && p.tags.indexOf(tag.toLowerCase()) > -1;
	});

	model.partials = _.clone(partials);
	
	_.each(model.pages, function(page){
		if(page.date)
			page.pubDate = moment(page.date).format('MMMM Do, YYYY'); 

		if(page.summary)
			page.body = markdown(page.summary);
	});

	res.render('all', model);
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
			change: function(){ //TODO: only invalidate cache when JSON files change
				console.log('Change detected: invalidating cache');
				populateCache(basePath);
			}
		}
	});
}

function oldest(res, basePath){
	page(res, basePath, '', pagesCache[0]);
}

function page(res, basePath, localPath, fileName){
	var fullpath = path.join(basePath, pagesDir, localPath, fileName);

	var jsonPath = path.join(localPath, fileName);
	
	var model = _.find(pagesCache, function(page){ return page.path == jsonPath;});
	if(!model)
		return res.send(jsonPath + ' not found', 404);

	model.site = config.site;
	model.tags = tags();
	
	if(model.date)
		model.pubDate = moment(model.date).format('MMMM Do, YYYY'); 

	load(fullpath, function(err, data){
		if(err)
			return res.send(err, 500);

		model.body = markdown(data);
		model.partials = _.clone(partials);

		res.render('page', model);
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

