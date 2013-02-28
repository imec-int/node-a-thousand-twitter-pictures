var httpreq = require('httpreq');
var OAuth       = require('oauth').OAuth;
var querystring = require('querystring');
var config = require('./config');
var util = require('util');


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



findTwitterPictures("#quizmequick", function (err, pictures){
	console.log(pictures);
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
		count: 20,
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

