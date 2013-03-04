App = {
	imageElements: [],

	intervalTime: 50,

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

		$("#start").click(function (event){
			App.flashImages();
		});

		// ook de server kan dit in gang steken
		App.socket.on('start', function (data) {
			App.flashImages();
		})

		// doe dit weg als je niet wilt dat het begint bij het laden van de pagina:
		setTimeout(function(){
			App.flashImages();
		},500);
	},

	addPicture: function(url){
		var image = new Image();
		image.onload = function(){
			var imageElement = $(document.createElement('img')).attr('src', url).addClass('picture');
			App.imageElements.push(imageElement);

			$("#pictures").append(imageElement);
		};
		image.src = url;
	},

	flashImages: function(){
		App.showNextImage(0);
	},

	showNextImage: function(i){
		if(i < App.imageElements.length){
			if(App.imageElements[i-1]){
				App.imageElements[i-1].hide();
				App.imageElements[i-1].remove();
			}
			App.imageElements[i].show();
			i++;
		}

		setTimeout(function (){
			App.showNextImage(i)
		}, App.intervalTime);
	}
};

$(App.pageloaded);

