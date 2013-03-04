/**
 * Init
 */
var httpreq 	= require('httpreq');
var OAuth       = require('oauth').OAuth;
var querystring = require('querystring');
var config 		= require('./config');
var util 		= require('util');
var async 		= require('async');
var cheerio 	= require('cheerio');
var _ 			= require('underscore');
var express 	= require('express');
var http 		= require('http')
var path 		= require('path');
var socketio 	= require('socket.io');

var app = express();

app.configure(function(){
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser('123456789987654321'));
	app.use(express.session());
	app.use(app.router);
	app.use(require('stylus').middleware(__dirname + '/public'));
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

var server = http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});

var io = require('socket.io').listen(server);

// authentication for other twitter requests
var twitterOAuth = new OAuth(
	"https://api.twitter.com/oauth/request_token",
	"https://api.twitter.com/oauth/access_token",
	config.twitter.consumerKey,
	config.twitter.consumerSecret,
	"1.0",
	null,
	"HMAC-SHA1"
);

// some variable to hold the state of the app
var State = {
	searchterm: "#eten",
	pictures: []
};

/**
 * Functies en andere logica
 */

// Webserver root page:
app.get('/', function (req, res){
	res.render('index', {
		title: 'A thousand twitter pictures'
	});
});

// Javascript die alle urls bevat van pictures die al gevonden zijn:
app.get('/server.js', function (req, res){
	res.send("App.alreadyfoundpictures = " + JSON.stringify(State.pictures) + ";");
});


// Begin met pictures te zoeken:
// Doet dit iedere 20 seconden:
findMorePictures();
setInterval(findMorePictures, 1000*20);

function findMorePictures(){
	searchPictures(State.searchterm, function (err, pictures){
		for(var i in pictures){
			var picture = pictures[i];

			if(!_.contains(State.pictures, picture)){
				console.log("Adding " + picture);
				State.pictures.push(picture);

				// stuur maar direct naar de client ook:
				io.sockets.emit('newpicture', {url: picture});
			}
		}
	});
}



function searchPictures(searchterm, callback){

	var allpictures = [];

	findTwitterPictures(searchterm, function (err, pictures){
		if(err) return callback(err);

		allpictures = allpictures.concat(pictures.pictures);
		extractInstagramUrls(pictures.instagram, function (err, instagramUrls){
			if(err) return callback(err);

			allpictures = allpictures.concat(instagramUrls);


			return callback(null, allpictures);
		});
	});
}


function findTwitterPictures(searchterm, callback) {
	findTwitterEntities(searchterm, function (err, entities) {
		if(err) return callback(err);

		var pictureUrls = [];
		var instagramUrls = [];

		for(var i in entities){
			var entity = entities[i];
			if(entity.media){
				for(var j in entity.media){
					var media = entity.media[j];
					if(media.type == 'photo'){
						pictureUrls.push(media.media_url);
					}
				}
			}

			if(entity.urls){
				for(var j in entity.urls){
					var url = entity.urls[j];
					if(url.expanded_url.match(/http(s)?:\/\/instagr.am\/.+/i)){
						instagramUrls.push(url.expanded_url);
					}
				}
			}
		}

		callback(null, {
			pictures: pictureUrls,
			instagram: instagramUrls
		});

	});

}

function findTwitterEntities(searchterm, callback) {
	var parameters = querystring.stringify({
		q: searchterm,
		result_type: 'mixed',
		count: 100,
		include_entities: true
	});

	twitterOAuth.getProtectedResource('https://api.twitter.com/1.1/search/tweets.json?' + parameters, "GET", config.twitter.token, config.twitter.secret,
		function (err, data, res){
			if(err) return callback(err);

			data = JSON.parse(data);

			var tweets = data.statuses;
			var entities = new Array();
			for(var i in tweets){
				entities.push(tweets[i].entities);
			}
			callback(null, entities);
		}
	);
}


function extractInstagramUrls(urls, callback){
	var extractedUrls = [];

	async.forEach(urls, function (url, c){
		extractInstagramUrl(url, function (err, extractedUrl){
			if(err) return c(err);
			extractedUrls.push(extractedUrl);
			c(null);
		});
	}, function (err){
		callback(null, extractedUrls);
	});
}

function extractInstagramUrl(url, callback){
	httpreq.get(url, function (err, res){
		if(err) return callback(err);

		// check for redirects:
		if(res.headers.location){
			extractInstagramUrl(res.headers.location, callback);
		}else{
			var $ = cheerio.load(res.body);
			var extractedUrl = $("#media_photo .photo").attr('src');
			callback(null, extractedUrl);
		}
	});
}














