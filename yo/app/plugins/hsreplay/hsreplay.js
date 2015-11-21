var hsreplay = {

	replay: undefined,

	init: function(config, review) {
		console.log('init replay', config, review);

		$.get('/replay.xml', function(replayXml) {
			this.loadReplay(replayXml);
		});
	},

	loadReplay: function(replayXml) {
		console.log('loading replay');
		
		this.parser.xmlReplay = replayXml;
		this.replayPlayer.parser = this.parser;
	}

}