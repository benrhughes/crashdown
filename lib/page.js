exports.page = page;
exports.oldest = oldest;
exports.pages = pages;
exports.listAll = listAll;
exports.tag = tag;
exports.tags = tags;
exports.rss = rss;
exports.populateCache = populateCache;
exports.watchCache = watchCache;
exports.setOptions = setOptions;

var config = require('../config.json');

var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var markdown = require('marked');
var glob = require('glob');
var watchr = require('watchr');
var moment = require('moment');

var options = {};
var pagesCache = [];
var updatingCache = false;

// constants
var jsonExt  = '.json';
var mkdExt = '.mkd';
var partials = { head : 'head', foot : 'foot', prevnext : 'prevnext', pagedata : 'pagedata'};

markdown.setOptions({
	  highlight: function (code) {
		      return require('highlight.js').highlightAuto(code).value;
			    }
});

function setOptions(opts){
	options = opts;
}

function oldest(cb){
	var p = parseInt(config.pagesToDisplay);
	var pageNum =  pagesCache.length / p;
	pageNum = pagesCache.length % p == 0 ? pageNum - 1  : pageNum;

	console.log('page: ' + pageNum);
	pages(pageNum, cb);
}

function pages(pageNum, cb){
	var first = config.pagesToDisplay * pageNum;
	var last = Math.min(pagesCache.length, first + parseInt(config.pagesToDisplay));

	var model = {};
	model.site = config.site;
	model.partials = _.clone(partials);
	model.pages = [];

	function createCallback(page){
		return function(err, data){
			if(err)
				return c(err);

			var p = _.clone(page);
			p.body = markdown(data);
			if(p.date)
				p.pubDate = moment(p.date).format('MMMM Do, YYYY'); 

			model.pages.push(p);	
			
			if(model.pages.length == last - first){
			  model.pages.sort(function(a, b){ return b.date - a.date;});

				if(first > 0)
					model.next = '/pages/' + (parseInt(pageNum)-1);

				if(last < pagesCache.length)
					model.prev = '/pages/' + (parseInt(pageNum)+1);

				cb(null, 'pages', model);
			}
		}
	}

	for(var i = first; i < last; i++){
		var page = pagesCache[i];
		
		if(!page)
			continue;

		load(page.path, createCallback(page) );
	}
}

function listAll(cb){
	getAll(function(model){
		cb(null,'all', model);
	});
}

function rss(cb){
	getAll(function(model){
		cb(null,'rss', model);		
	});
}

function getAll(callback){
	var model = {};
	model.site = config.site; 
	model.title = 'All Pages';
	model.pages = _.clone(pagesCache);
	model.partials = _.clone(partials);

	_.each(model.pages, function(page){
		if(page.date)
			page.pubDate = moment(page.date).format('MMMM Do, YYYY'); 

		if(page.summary)
			page.body = markdown(page.summary);
	});
	
	callback(model);
}

function tags(cb){
	var t = _.uniq(_.flatten(_.pluck(pagesCache, 'tags')));

	var model = {};
	model.site = config.site;
	model.title = 'Tags';
	model.tags = t;
	model.partials = _.clone(partials);

	cb(null,'tags', model);
}

function tag(tag, c){
	var model = {};
	model.site = config.site; 
	model.title = tag; 
	
	var pages = _.filter(pagesCache, function(p){ 
		return p.tags && _.any(p.tags, function(t){ return t.toLowerCase() == tag.toLowerCase();}); 
	});
	
	model.pages = _.clone(pages);
	model.partials = _.clone(partials);
	
	_.each(model.pages, function(page){
		if(page.date)
			page.pubDate = moment(page.date).format('MMMM Do, YYYY'); 

		if(page.summary)
			page.body = markdown(page.summary);
	});

	c(null,'all', model);
}

function populateCache()
{
	if(updatingCache)
		return;

	updatingCache = true;
	pagesCache = [];

	glob('**/*.json', { cwd: options.pagesDir }, function(err, files){
		_.each(files, function(file){
			fs.readFile(path.join(options.pagesDir, file), 'utf8', function(err, data){
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

function watchCache()
{
	watchr.watch({
		path: options.pagesDir, 
		listeners: {
			change: function(){ //TODO: only invalidate cache when JSON files change
				console.log('Change detected: invalidating cache');
				populateCache();
			}
		}
	});
}

function page(localPath, fileName, cb){
	var fullpath = path.join(localPath, fileName);
	
	var page = _.find(pagesCache, function(page){ return page.path == fullpath;});

	var model = _.clone(page);
	if(!model)
		return cb(fullpath + ' not found', 404);

	model.site = config.site;
	
	if(model.date)
		model.pubDate = moment(model.date).format('MMMM Do, YYYY'); 

	idx = _.indexOf(pagesCache, page) -1;
	model.next = idx >= 0 ? '/' + pagesCache[idx].path : null;

	idx = _.indexOf(pagesCache, page) +1;
	model.prev= idx < pagesCache.length ? '/' + pagesCache[idx].path : null;
	
	load(fullpath, function(err, data){
		if(err)
			return cb(err, 500);

		model.body = markdown(data);
		model.partials = _.clone(partials);

		cb(null, 'page', model);
	});
}

//callback(err, data)
function load(page, callback){
	var fullpath = path.join(options.pagesDir, page);
	console.log('Loading ' + page);
	var mkdPath = fullpath + mkdExt;
	
	fs.exists(mkdPath, function(exists){
		if(!exists)
			return callback(fullpath + " not found", 404); 

		fs.readFile(mkdPath, 'utf8', function(err,data){
			if(err)
				return callback(err); 

			callback(null, data);
		});
	});
}

