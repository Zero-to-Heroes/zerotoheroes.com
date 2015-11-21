$(function() {
	console.log('loading parser');
	hsreplayPlayer.parser = {

		xmlreplayPlayer: undefined,
		replayPlayer: undefined,
		entities: {},
		state: ['root'],
		entityDefinition: {tags: {}},
		actionDefinition: {},
		stack: [],

		tsToSeconds: function(ts) {
			var parts = ts.split(':');
			var hours = parseInt(parts[0]) * 60 * 60;
			var minutes = parseInt(parts[1]) * 60;
			var seconds = parseFloat(parts[2]);
			return hours + minutes + seconds
		},

		parse: function(replayPlayer) {
			this.replayPlayer = replayPlayer;
			var hsax = hsreplayPlayer.parser.sax = sax.createStream(true);

			hsax.on('opentag', function(node) {
				this.onOpenTag(node);
			});
			hsax.on('closetag', function() {
				this.onCloseTag();
			});

			// @stream = fs.createReadStream(@path).pipe(@sax)
		},

		rootState: function(node) {
			switch (node.name) {
				case 'Game': 
					this.replayPlayer.start(this.tsToSeconds(node.attributes.ts));
					break;

				case 'Action':
					this.replayPlayer.enqueue(tsToSeconds(node.attributes.ts), 'receiveAction');
					this.state.push('action');
					break;

				case 'TagChange':
					this.replayPlayer.enqueue(null, 'receiveTagChange', 
						entity: parseInt(node.attributes.entity),
						tag: hsreplayPlayer.enums.tagNames[node.attributes.tag],
						value: parseInt(node.attributes.value));
					break;

				case 'GameEntity':
				case 'Player':
				case 'FullEntity':
					this.state.push('entity');
					this.entityDefinition.id = parseInt(node.attributes.id);
					if (node.attributes.cardID) 
						this.entityDefinition.cardID = node.attributes.cardID;
					if (node.attributes.name)
						this.entityDefinition.name = node.attributes.name;
					break;

				case 'Options':
					this.state.push('options');
					break;

				case 'ChosenEntities':
					this.chosen = {
						entity: node.attributes.entity,
						playerID: node.attributes.playerID,
						ts: this.tsToSeconds(node.attributes.ts),
						cards: []
					}
					this.state.push('chosenEntities');
					break;
			}	
		},

		chosenEntitiesState: function(node) {
			switch (node.name) {
				case 'Choice':
					this.chosen.cards.push(node.attributes.entity);
					break;
			}
		},

		chosenEntitiesStateClose: function(node) {
			switch (node.name) {
				case 'ChosenEntities':
					this.state.pop();
					this.replayPlayer.enqueue(this.chosen.ts, 'receiveChosenEntities', this.chosen);
					break;
			}
		},

		optionsStateClose: function(node) {
			switch (node.name) {
				case 'Options': 
					this.state.pop();
					this.replayPlayer.enqueue(this.tsToSeconds(node.attributes.ts), 'receiveOptions', node);
					break;
			}
		},

		entityState: function(node) {
			switch (node.name) {
				case 'Tag':
					this.entityDefinition.tags[hsreplayPlayer.enums.tagNames[parseInt(node.attributes.tag)]] = parseInt(node.attributes.value);
					break;
			}
		},

		entityStateClose: function(node) {
			var ts = null;
			if (node.attributes.ts) 
				ts = this.tsToSeconds(node.attributes.ts);

			switch (node.name) {
				case 'GameEntity':
					this.state.pop();
					this.replayPlayer.enqueue(ts, 'receiveGameEntity', this.entityDefinition);
					this.entityDefinition = {tags: {}};
					break;
				case 'Player':
					this.state.pop();
					this.replayPlayer.enqueue(ts, 'receivePlayer', this.entityDefinition);
					this.entityDefinition = {tags: {}};
					break;
				case 'FullEntity':
					this.state.pop();
					this.replayPlayer.enqueue(ts, 'receiveEntity', this.entityDefinition);
					this.entityDefinition = {tags: {}};
					break;
				case 'ShowEntity':
					this.state.pop();
					this.replayPlayer.enqueue(ts, 'receiveShowEntity', this.entityDefinition);
					this.entityDefinition = {tags: {}};
					break;
			},

			actionState: function(node) {
				switch (node.name) {
					case 'ShowEntity':
					case 'FullEntity':
						this.state.push('entity');
						this.entityDefinition.id = parseInt(node.attributes.entity || node.attributes.id);
						if (node.attributes.cardID)
							this.entityDefinition.cardID = node.attributes.cardID;
						if (node.attributes.name)
							this.entityDefinition.name = node.attributes.name;
						break;
					case 'TagChange':
						this.replayPlayer.enqueue(null, 'receiveTagChange', 
							entity: parseInt(node.attributes.entity),
							tag: hsreplayPlayer.enums.tagNames[node.attributes.tag],
							value: parseInt(node.attributes.value));
						break;
					case 'Action':
						this.state.push('action');
						this.replayPlayer.enqueue(this.tsToSeconds(node.attributes.ts), 'receiveAction');
						break;
					case 'Choices':
						this.choices = {
							entity: parseInt(node.attributes.entity),
							max: node.attributes.max,
							min: node.attributes.min,
							playerID: node.attributes.playerID,
							source: node.attributes.source,
							ts: this.tsToSeconds(node.attributes.ts),
							cards: []
						}
						this.state.push('choices');
						break;
				}
			},

			choicesState: function(node) {
				switch (node.name) {
					case 'Choice':
						this.choices.cards.push(node.attributes.entity);
						break;
				}
			},

			choicesStateClose: function(node) {
				switch (node.name) {
					case 'Choices':
						this.state.pop();
						this.replayPlayer.enqueue(this.choices.ts, 'receiveChoices', this.choices);
				}
			},

			actionStateClose: function(node) {
				var ts = null;
				if (node.attributes.ts) 
					ts = this.tsToSeconds(node.attributes.ts);

				switch (node.name) {
					case 'Action':
						this.state.pop();
						break;
				}
			},

			onOpenTag: function(node) {
				this.stack.push(node);
				// @["#{@state[@state.length-1]}State"]?(node)
				var method = this[this.state[this.state.length - 1] + "State"];
				if (method) method(node);

			},

			onCloseTag: function() {
				node = this.stack.pop();
				// @["#{@state[@state.length-1]}StateClose"]?(node)
				var method = this[this.state[this.state.length - 1] + "StateClose"];
				if (method) method(node);
			}
		}
	}
});