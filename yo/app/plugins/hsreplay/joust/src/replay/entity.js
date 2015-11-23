(function() {
  var Emitter, Entity, EventEmitter, _, ref, zoneNames, zones,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Emitter = require('event-kit').Emitter;

  ref = require('./enums'), zones = ref.zones, zoneNames = ref.zoneNames;

  _ = require('lodash');

  EventEmitter = require('events');

  Entity = (function(superClass) {
    extend(Entity, superClass);

    function Entity(replay) {
      this.replay = replay;
      EventEmitter.call(this);
      this.tags = {};
    }

    Entity.prototype.getController = function() {
      var ref1, ref2;
      if (((ref1 = this.replay.player) != null ? ref1.tags.CONTROLLER : void 0) === this.tags.CONTROLLER) {
        return this.replay.player;
      } else if (((ref2 = this.replay.opponent) != null ? ref2.tags.CONTROLLER : void 0) === this.tags.CONTROLLER) {
        return this.replay.opponent;
      }
      return null;
    };

    Entity.prototype.getLastController = function() {
      var ref1, ref2;
      if (((ref1 = this.replay.player) != null ? ref1.tags.CONTROLLER : void 0) === this.lastController) {
        return this.replay.player;
      } else if (((ref2 = this.replay.opponent) != null ? ref2.tags.CONTROLLER : void 0) === this.lastController) {
        return this.replay.opponent;
      }
      return null;
    };

    Entity.prototype.update = function(definition) {
      var changed, k, old, ref1, ref10, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, tag, v, value;
      old = _.assign({}, this.tags);
      if (definition.tags.ZONE) {
        this.lastZone = old.ZONE;
      }
      if (definition.tags.CONTROLLER) {
        this.lastController = old.CONTROLLER;
      }
      if (definition.id) {
        this.id = definition.id;
      }
      if (definition.tags) {
        ref1 = definition.tags;
        for (k in ref1) {
          v = ref1[k];
          this.tags[k] = v;
        }
      }
      if (definition.cardID) {
        this.cardID = definition.cardID;
        this.emit('revealed', {
          entity: this
        });
      }
      if (definition.name) {
        this.name = definition.name;
      }
      changed = _.pick(definition.tags, function(value, tag) {
        return value !== old[tag];
      });
      for (tag in changed) {
        value = changed[tag];
        if (value !== old[tag]) {
          this.emit("tag-changed:" + tag, {
            entity: this,
            oldValue: old[tag],
            newValue: value
          });
        }
      }
      if (changed.ZONE) {
        if (old.ZONE) {
          this.emit("left-" + (zoneNames[old.ZONE].toLowerCase()), {
            entity: this
          });
          if (old.ZONE === zones.DECK) {
            if ((ref2 = this.getController()) != null) {
              ref2.entityLeftDeck(this);
            }
          }
        }
        this.emit("entered-" + (zoneNames[changed.ZONE].toLowerCase()), {
          entity: this
        });
        if (changed.ZONE === zones.HAND) {
          if ((ref3 = this.getController()) != null) {
            ref3.entityEnteredHand(this);
          }
        }
        if (changed.ZONE === zones.PLAY) {
          if ((ref4 = this.getController()) != null) {
            ref4.entityEnteredPlay(this);
          }
        }
        if (changed.ZONE === zones.DECK) {
          if ((ref5 = this.getController()) != null) {
            ref5.entityEnteredDeck(this);
          }
        }
        if (changed.ZONE === zones.SECRET) {
          if ((ref6 = this.getController()) != null) {
            ref6.entityEnteredSecret(this);
          }
        }
      }
      if (changed.CONTROLLER) {
        if (old.ZONE === zones.HAND) {
          this.emit('left-hand', {
            entity: this
          });
          if ((ref7 = this.getController()) != null) {
            ref7.entityEnteredHand(this);
          }
        }
        if (old.ZONE === zones.PLAY) {
          this.emit('left-play', {
            entity: this
          });
          if ((ref8 = this.getController()) != null) {
            ref8.entityEnteredPlay(this);
          }
        }
        if (old.ZONE === zones.DECK) {
          this.emit('left-deck', {
            entity: this
          });
          if ((ref9 = this.getController()) != null) {
            ref9.entityEnteredDeck(this);
          }
        }
        if (old.ZONE === zones.SECRET) {
          this.emit('left-secret', {
            entity: this
          });
          return (ref10 = this.getController()) != null ? ref10.entityEnteredSecret(this) : void 0;
        }
      }
    };

    Entity.prototype.getLastZone = function() {
      return this.lastZone;
    };

    return Entity;

  })(EventEmitter);

  module.exports = Entity;

}).call(this);
