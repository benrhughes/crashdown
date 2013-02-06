var config = require('./config.json');
var page = require('./lib/page.js');

var cons = require('consolidate');
var path = require('path');
var express = require('express');
var app = express();

// set up cons and hogan templating
app.engine('html', cons.hogan);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'theme/templates'));

// routes
app.get('/', function(req, res){
	res.send('Most Recent Page (or maybe index?)');
});

app.get('/pages/:page', function(req, res){
	res.send('list of pages');
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

app.get('/:slug', function(req, res){
	page.load(res, __dirname, '',  req.params.slug);
});

// GET /some/long/path/to/file
app.get('/*/:path', function(req, res){
	var path = req.params.path;
	var slug = req.params[0];

	page.load(res, __dirname, path, slug);
});

var port = config.port || 80; 
app.listen(port);
console.log('Serving "' + config.site + '" on port ' + port);
