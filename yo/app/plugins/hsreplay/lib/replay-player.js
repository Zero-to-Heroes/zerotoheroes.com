$(function() {
	console.log('loading replay-player');
	hsreplay.replayPlayer = {

		// https://github.com/Olical/EventEmitter
		this.emitter = new EventEmitter();

		entities: {},
		players: [],

		game: null,
		player: null,
		opponent: null,

		history: [],
		historyPosition: 0,
		lastBatch: null,

		startTimestamp: null,
		startTime: (new Date()).getTime(),

		started: false,
		// window.replay = this

		run: function() {
			this.parser.parse(this);
			setInterval(function() {
				this.update()
			}, 200);
		},

		start: function(timestamp) {
			this.startTimestamp = timestamp;
			this.started = true;
		},

		getTotalLength: function() {
			var position = this.history.length - 1;
			while (position >= 0) {
				if (this.history[position].timestamp) 
					return this.history[position].timestamp - this.startTimestamp;
				position--;			
			}
			return 0;
		},

		getElapsed: function() {
			return (new Date().getTime() - this.startTime) / 1000;
		},

		getTimestamps: function() {
			return _.map(this.history, function(batch) {
				batch.timestamp - this.timestamp;
			})
		},

		update: function() {
			var elapsed = this.getElapsed();
			if (this.historyPosition < this.history.length) {
				var next = this.history[this.historyPosition];
				if (!this.history[this.historyPosition].timestamp) {
					this.history[this.historyPosition].execute(this);
					this.historyPosition++;
				}
				else if (elapsed > this.history[this.historyPosition].timestamp - this.startTimestamp) {
					this.history[this.historyPosition].execute(this);
					this.historyPosition++;
				}
			}
		},

		receiveGameEntity: function(definition) {
			var entity = new Entity(definition, this);
			this.game = this.entities[definition.id] = entity;
		},

		receivePlayer: function(definition) {
			var entity = new Player(definition, this);
			this.entities[definition.id] = entity;
			this.players.push(entity);
			if (entity.tags.CURRENT_PLAYER)
				this.player = entity;
			else
				this.opponent = entity;
		},

		receiveEntity: function(definition) {
			var entity = new Entity(definition, this);
			this.entities[definition.id] = entity;

			if (definition.id == 68) {
				if (definition.cardID == 'GAME_005') {
					this.player = entity.getController();
					this.opponent = this.player.getOpponent();
				}
				else {
					this.opponent = entity.getController();
					this.player = this.opponent.getOpponent();
				}

				// Send event
				this.emitter.emitEvent('players-ready');
			}
		},

		receiveTagChange: function(change) {
			var tags = {};
			tags[change.tag] = change.value;

			if (this.entities[change.entity]) {
				var entity = this.entities[change.entity];
				entity.update(tags: tags);
			}
			else {
				var entity = this.entities[change.entity] = new Entity( {
					id: change.entity,
					tags: tags
				}, this);
			}
		},

		receiveShowEntity: function(definition) {
			if (this.entities[definition.id]) 
				this.entities[definition.id].update(definition);
			else
				this.entities[definition.id] = new Entity(definition, this);
		},

		receiveAction: function(definition) {

		},

		receiveOptions: function() {

		},

		receiveChoices: function(choices) {

		},

		receiveChosenEntities: function(chosen) {

		},

		enqueue: function(timestamp, command, args...) {
			if (!timestamp && this.lastBatch) {
				this.lastBatch.addCommand([command, args]);
			}
			else {
				this.lastBatch = new HistoryBatch(timestamp, [command, args]);
				this.history.push(this.lastBatch);
			}
		},

		onPlayersReady: function(callback) {
			this.emitter.addListener('players-ready', callback);
		}
	}
});