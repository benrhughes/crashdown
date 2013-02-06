#How To Use Crashdown.js

## About
Crashdown is a simple, file-based web publishing engine. Posts are written in Markdown and URLs are based on your directory structure.

For example, the file `/var/www/mysite/posts/2012/04/my-new-post.mkd` will have a URL of `mysite.com/2012/04/my-new-post`. 

There is no database involved, which means that you can easily use your version control system of choice to manage and deploy your site.

## Getting set up
On your server:

	$> npm install crashdown
	$> crashdown init /var/www/mysite # creates mysite directory and populates it
	
There are some configuration options set in `config.json`, such as the port that the server listens on.

	$> crashdown /var/www/mysite # starts the server	

## Creating a new post
In mysite/posts:

	$> crashdown post <url-slug>

This will create `url-slug.mkd` and `url-slug.json`. Edit the .mkd file to contain the body of your post, then fill out the metadata in the .json file. 

Go to `mysite.com/url-slug` in your browser: your post should be displayed.

## Setting up git deployment
On your server:

	$> cd /var/www/mysite
	$> git init
	$> git add .
	$> git commit -m "initial commit"

On your local machine

	$> npm install crashdown
	$> git clone ssh://user@mysite.com/var/www/mysite

## Deploying with git
Create a new post in your local clone with `crashdown post <url-slug>`, as above. Then

	$> git commit -am "My new post"
	$> git push

NB, if you don't want to (or can't) install node and crashdown locally, you can simply create the .mkd and .json files yourself. `crashdown post` is just a helper to save you time.

## Testing before deployment
The entire site is contained in the git repository, which means that it can be tested locally before pushing by running `crashdown mysite` on your local machine, then going to `http://localhost` in your browser.

If you want to regularly share your test site with others, you can set up a second instance of crashdown (running on a seperate server, or on a different port on your prod server) and push to it before you push to prod.

## Multiple authors
If you're using git, multiple authors are dealt with the same way as git manages source code (ie you can have multiple concurrent editors, but you'll need to merge changes etc). 

You can either give everyone direct SSH access to your server to allow them to push to the live site, or set up a vetting process. For example, you might keep a shared 'master' on github or bitbucket that anyone can access, but only certain people have access to push to your prod server.

## Load balancing
It is trivial to set up load balancing between servers with, for example, nginx. Just push to each balanced server whenever you make a change - because the site is essentially stateless you don't have to worry about replication etc.
