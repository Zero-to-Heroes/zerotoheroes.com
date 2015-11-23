(function() {
  var Entity, Player, _, ref, zoneNames, zones,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('./enums'), zones = ref.zones, zoneNames = ref.zoneNames;

  _ = require('lodash');

  Entity = require('./entity');

  Player = (function(superClass) {
    extend(Player, superClass);

    function Player(definition, replay) {
      Player.__super__.constructor.call(this, definition, replay);
    }

    Player.prototype.getHand = function() {
      var hand;
      hand = _.filter(this.replay.entities, (function(_this) {
        return function(entity) {
          return entity.tags.ZONE === zones.HAND && entity.tags.CONTROLLER === _this.tags.CONTROLLER;
        };
      })(this));
      return _.sortBy(hand, function(entity) {
        return entity.tags.ZONE_POSITION;
      });
    };

    Player.prototype.getDeck = function() {
      return _.filter(this.replay.entities, (function(_this) {
        return function(entity) {
          return entity.tags.ZONE === zones.DECK && entity.tags.CONTROLLER === _this.tags.CONTROLLER;
        };
      })(this));
    };

    Player.prototype.getBoard = function() {
      var board;
      board = _.filter(this.replay.entities, (function(_this) {
        return function(entity) {
          return entity.tags.ZONE === zones.PLAY && entity.tags.CONTROLLER === _this.tags.CONTROLLER && entity.tags.CARDTYPE === 4;
        };
      })(this));
      return _.sortBy(board, function(entity) {
        return entity.tags.ZONE_POSITION;
      });
    };

    Player.prototype.getHero = function() {
      return this.replay.entities[this.tags.HERO_ENTITY];
    };

    Player.prototype.getOpponent = function() {
      if (this.tags.CONTROLLER === 1) {
        return this.replay.entities[3];
      } else {
        return this.replay.entities[2];
      }
    };

    Player.prototype.entityEnteredHand = function(entity) {
      return this.emit('entity-entered-hand', {
        entity: entity
      });
    };

    Player.prototype.entityLeftDeck = function(entity) {
      return this.emit('entity-left-deck', {
        entity: entity
      });
    };

    Player.prototype.entityEnteredDeck = function(entity) {
      return this.emit('entity-entered-deck', {
        entity: entity
      });
    };

    Player.prototype.entityEnteredPlay = function(entity) {
      return this.emit('entity-entered-play', {
        entity: entity
      });
    };

    Player.prototype.entityEnteredSecret = function(entity) {
      return this.emit('entity-entered-secret', {
        entity: entity
      });
    };

    return Player;

  })(Entity);

  module.exports = Player;

}).call(this);
