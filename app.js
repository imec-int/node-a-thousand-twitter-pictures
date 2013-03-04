var httpreq = require('httpreq');
var OAuth       = require('oauth').OAuth;
var querystring = require('querystring');
var config = require('./config');
var util = require('util');
var async = require('async');
var cheerio = require('cheerio');

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


findTwitterPictures("#food", function (err, pictures){
	extractInstagramUrls(pictures.instagram, function (err, instagramUrls){
		if(err) return console.log(err);

		pictures.instagram = instagramUrls;

		console.log(pictures);
	});
});


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
		count: 4,
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














