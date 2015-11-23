var hsreplay = {

	replay: undefined,

	init: function(config, review) {
		console.log('init replay', config, review);

		require('coffee-react/register');
		require('src/front/bundle');

		$.get('/replay.xml', function(replayXml) {
			this.loadReplay(replayXml);
		});
	},

	loadReplay: function(replayXml) {
		console.log('loading replay');

	}

}