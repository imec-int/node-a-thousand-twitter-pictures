App = {
	pageloaded: function() {
		console.log("page loaded");

		// socket.io initialiseren
		App.socket = io.connect(window.location.hostname);

		// on socket newpicture
		App.socket.on('newpicture', function (data) {
			App.addPicture(data.url)
		});

		//
		for(var i in App.alreadyfoundpictures){
			App.addPicture(App.alreadyfoundpictures[i]);
		}
	},

	addPicture: function(url){
		var image = new Image();
		image.onload = function(){
			$("#pictures").append('<img src="' + url + '" />');
		};
		image.src = url;
	}
};

$(App.pageloaded);

