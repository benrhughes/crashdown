var config = require('./config.json');
var page = require('./lib/page.js');

var cons = require('consolidate');
var path = require('path');
var _ = require('underscore');

var express = require('express');
var app = express();

var uploadsDir = 'uploads';
var themesDir = 'theme';

// set up cons and hogan templating
app.engine('html', cons.hogan);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, themesDir, 'templates'));

page.setOptions({pagesDir: path.join(__dirname, 'pages')});

// routes
app.get('/favicon.ico', function(req, res){
	res.sendfile(path.join(__dirname, 'favicon.ico'));
});

function render(res, err, template, model){
	if(err)
		return res.send(err, template);

	res.render(template, model);
}

app.get('/', function(req, res){
	page.pages(0, _.partial(render, res));
});

app.get('/all', function(req, res){
	page.listAll(_.partial(render, res));
});

app.get('/pages/:num', function(req, res){
	page.pages(req.params.num, _.partial(render, res));
});

// get /search?q=term
app.get('/search*', function(req, res){
	res.send('Search for "' + req.query.q + '"');
});

app.get('/rss', function(req, res){
	page.rss(function(err, template, model){
		if(err)
			return res.send(err, template);

		res.type('application/xml');
		res.render(template, model);
	});
});

app.get('/tags', function(req, res){
	page.tags(_.partial(render, res));
});

app.get('/tag/:tag', function(req,res){
	page.tag(req.params.tag, _.partial(render, res));
});

app.get('/uploads/*', function(req, res){
	var file = req.params[0];

	res.sendfile(path.join(__dirname, themesDir, file));
}
);
app.get('/static/*', function(req, res){
	var file = req.params[0];

	res.sendfile(path.join(__dirname, themesDir, file));
});

app.get('/:slug', function(req, res){
	page.page('', req.params.slug, _.partial(render, res));
});

// GET /some/long/path/to/file
app.get('/*/:path', function(req, res){
	var path = req.params.path;
	var slug = req.params[0];

	page.page(path, slug, _.partial(render, res));
});

page.populateCache();
page.watchCache();

var port = config.port || 80; 
app.listen(port);
console.log('Serving "' + config.site + '" on port ' + port);

