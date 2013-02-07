exports.load = load;
exports.all = all;

var config = require('../config.json');

var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var markdown = require('marked');
var glob = require('glob');

// constants
var pagesDir = 'pages';
var jsonExt  = '.json';
var mkdExt = '.mkd';
var partials = { head : 'head', foot : 'foot'}

function index(res, basePath){
	//
}

function all(res, basePath){
	var pages = [];
	findAll(basePath, function(err, files){
		_.each(files, function(file){
			fs.readFile(path.join(basePath, pagesDir, file), 'utf8', function(err, data){
				var page = JSON.parse(data);
				page.path = file.replace(jsonExt,'');
				pages.push(page);

				if(pages.length == files.length){
					var info = {};
					info.site = config.site; 
					info.title = 'All Pages';
					info.pages = pages;
					info.partials = _.clone(partials);

					res.render('pages', info);
				}
			});
		});
	});
}

function findAll(basePath, callback){
	glob('**/*.json', { cwd: path.join(basePath, pagesDir) }, callback);
}

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

