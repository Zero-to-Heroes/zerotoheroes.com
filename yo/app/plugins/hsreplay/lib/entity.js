var Entity = function(definition, replay) {
	this.replay = replay;

	this.emitter = new EventEmitter();
	this.id = definition.id;
	this.tags = definition.tags;
	this.name = definition.name;
	this.cardID = definition.cardID;
	this.mulliganChoices = [];

	if (this.tags.ZONE == hsreplayPlayer.enums.zones.HAND) {
		if (this.getController && this.getController().notifyHandChanged) {
			this.getController().notifyHandChanged();
		}
	}
	if (this.tags.ZONE == hsreplayPlayer.enums.zones.DECK) {
		if (this.getController && this.getController().notifyDeckChanged) {
			this.getController().notifyDeckChanged();
		}
	}
	if (this.tags.ZONE == hsreplayPlayer.enums.zones.PLAY) {
		if (this.getController && this.getController().notifyBoardChanged) {
			this.getController().notifyBoardChanged();
		}
	}
	if (this.tags.RESOURCES_USED || this.tags.RESOURCES) {
		this.emitter.emitEvent('mana-changed');
	}
	if (this.tags.HERO_ENTITY) {
		this.emitter.emitEvent('hero-changed');
	}
}

Entity.prototype.getController = function() {
	if (this.replay.player && this.replay.player.tags.CONTROLLER == this.tags.CONTROLLER) {
		return this.replay.player;
	}
	else if (this.replay.opponent && this.replay.opponent.tags.CONTROLLER == this.tags.CONTROLLER) {
		return this.replay.opponent;
	}
	return null;
}

Entity.prototype.update = function(definition) {
	this.original = _.pick(this.tags, Object.keys(definition.tags));

	if (definition.id) 
		this.id = definition.id;
	if (definition.tags) {
		for (var k, v of definition.tags) {
			this.tags[k] = v;
		}
	}
	if (definition.cardID)
		this.cardID = definition.cardID;

	var zoneChange = (definition.tags.ZONE_POSITION || definition.tags.CONTROLLER || definition.tags.ZONE);
}