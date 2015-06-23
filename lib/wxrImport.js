var x2js = require('xml2js');
var fs = require('fs');
var _ = require('underscore');

function imp(xml){
	x2js.parseString(xml, function(err, result){
		var posts = result.rss.channel[0].item;

		_.each(posts, function(post){
			var file = '../pages/imported/' + post['wp:post_name'][0];
			json = {
				title: post.title[0],
				author: post['dc:creator'][0],
				date: post.pubDate[0],
				tags: _.filter(_.pluck(post.category, '_'), function(c){ return c != 'Uncategorized';})
			};
			content= post['content:encoded'][0].trim();

			fs.writeFile(file + '.json', JSON.stringify(json, null, '\t'));
			fs.writeFile(file + '.mkd', content);
		});
	});
}
fs.mkdir('../pages/imported/',null, function(err){
	fs.readFile(process.argv[2], function(err, data){
		imp(data);
	});
});
