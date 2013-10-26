## 10 Second Setup
	$> git clone git@github.com:benrhughes/crashdown.git /home/ben/mysite
	$> cd /home/ben/mysite && npm install 
	$> node /home/ben/mysite/server.js	
	
Go to [http://localhost:3000](http://localhost:3000) in your browser
	
## About
Crashdown is a simple, file-based web publishing engine. Posts are written in Markdown and URLs are based on your directory structure.

For example, the file `/home/ben/mysite/pages/2012/04/my-new-post.mkd` will have a URL of `http://localhost/2012/04/my-new-post`. 

There is no database involved, which means that you can easily use your version control system of choice to manage and deploy your site.

## Motivation
I like writing in markdown, and I like being about to track and move my files around using git. I also have a few sites on self-hosted Wordpress that I wanted to run on something more lightweight. There's plenty of options out there, but none that I found did quite what I wanted. So, I wrote my own. What's the point of being a dev if you don't make tools you like? :)

## Demo
[This Coding Life](http://thiscodinglife.com) is running the latest version of crashdown.

## Getting set up
On your server:

	$> git clone git@github.com:benrhughes/crashdown.git /home/ben/mysite
	$> cd /home/ben/mysite $$ npm install

Optionally:

	$> npm install -g forever 
	
There are some configuration options set in `config.json`, such as the port that the server listens on.

	$> forever /home/ben/mysite/server.js # starts the server and keeps it running

Using `forever` is completely optional, but it's a nice way to run crashdown in the background while ensuring that it gets restarted should it ever crash. If you'd prefer to not use it, simply

	$> node /home/ben/mysite/server.js

## Creating a new post
The easiest way to get started is to copy the demo json file. In mysite/pages:

	$> cp hello.json firstpost.json
	$> touch firstpost.mkd

Edit the .mkd file to contain the body of your post, then fill out the metadata in the .json file. 

Go to `localhost:3000/firstpost` in your browser: your post should be displayed.

## Setting up git deployment
Follow the instructions in this [excellent article](http://toroid.org/ams/git-website-howto).

## Testing before deployment
The entire site is contained in the git repository, which means that it can be tested locally before pushing by running `node server.js` on your local machine, then going to `http://localhost:3000` in your browser.

If you want to regularly share your test site with others, you can set up a second instance of crashdown (running on a seperate server, or on a different port on your prod server) and push to it before you push to prod.

## Multiple authors
If you're using git, multiple authors are dealt with the same way as git manages source code (ie you can have multiple concurrent editors, but you'll need to merge changes etc). 

You can either give everyone direct SSH access to your server to allow them to push to the live site, or set up a vetting process. For example, you might keep a shared 'master' on github or bitbucket that anyone can access, but only certain people have access to push to your prod server.

## Load balancing
It is trivial to set up load balancing between servers with, for example, nginx. Just push to each balanced server whenever you make a change - because the site is essentially stateless you don't have to worry about replication etc.
