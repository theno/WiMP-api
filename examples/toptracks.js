var lame = require('lame');
var Speaker = require('speaker');
var WiMP = require('../index');
var username = process.env.UN;
var password = process.env.PW;
var artistId = 4948323;
WiMP.login(username, password, function(err, wimp){
	wimp.search('artist', 'Hvitmalt Gjerde', function(err, artists){
		var artist = artists[0];
		artist.getTopTracks(function(err, tracks){
			var track = tracks[0];
			console.log('Playing: %s - %s', track.artist.name, track.name);
			track.play()
			.pipe(new lame.Decoder())
			.pipe(new Speaker())
			.on('finish', function (){
				console.log('Song finished');
			});
		});
	});
});
