var config = require('./config.json');
var page = require('./lib/page.js');

var cons = require('consolidate');
var path = require('path');
var express = require('express');
var app = express();


var themesDir = 'theme';

// set up cons and hogan templating
app.engine('html', cons.hogan);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, themesDir, 'templates'));

// routes
app.get('/', function(req, res){
	page.pages(res, __dirname, 0);
});

app.get('/all', function(req, res){
	page.listAll(res, __dirname);
});

app.get('/pages/:num', function(req, res){
	page.pages(res, __dirname, req.params.num);
});

// get /search?q=term
app.get('/search*', function(req, res){
	res.send('Search for "' + req.query.q + '"');
});

app.get('/rss', function(req, res){
	res.send("Here's an RSS feed for you");
});

app.get('/tag/:tag', function(req,res){
	res.send('Posts tagged with ' + req.params.tag);
});

app.get('/static/*', function(req, res){
	var file = req.params[0];

	res.sendfile(path.join(__dirname, themesDir, file));
});

app.get('/:slug', function(req, res){
	page.page(res, __dirname, '',  req.params.slug);
});

// GET /some/long/path/to/file
app.get('/*/:path', function(req, res){
	var path = req.params.path;
	var slug = req.params[0];

	page.page(res, __dirname, path, slug);
});

page.populateCache(__dirname);
page.watchCache(__dirname);

var port = config.port || 80; 
app.listen(port);
console.log('Serving "' + config.site + '" on port ' + port);

