(function() {
  var HSReplayParser, fs, sax, tagNames, tsToSeconds;

  fs = require('fs');

  sax = require('sax');

  tagNames = require('../enums').tagNames;

  tsToSeconds = function(ts) {
    var hours, minutes, parts, seconds;
    parts = ts.split(':');
    hours = parseInt(parts[0]) * 60 * 60;
    minutes = parseInt(parts[1]) * 60;
    seconds = parseFloat(parts[2]);
    return hours + minutes + seconds;
  };

  HSReplayParser = (function() {
    function HSReplayParser(path) {
      this.path = path;
      this.entities = {};
      this.state = ['root'];
      this.entityDefinition = {
        tags: {}
      };
      this.actionDefinition = {};
      this.stack = [];
    }

    HSReplayParser.prototype.parse = function(replay) {
      this.replay = replay;
      this.sax = sax.createStream(true);
      this.sax.on('opentag', (function(_this) {
        return function(node) {
          return _this.onOpenTag(node);
        };
      })(this));
      this.sax.on('closetag', (function(_this) {
        return function() {
          return _this.onCloseTag();
        };
      })(this));
      return this.stream = fs.createReadStream(this.path).pipe(this.sax);
    };

    HSReplayParser.prototype.rootState = function(node) {
      switch (node.name) {
        case 'Game':
          return this.replay.start(tsToSeconds(node.attributes.ts));
        case 'Action':
          this.replay.enqueue(tsToSeconds(node.attributes.ts), 'receiveAction');
          return this.state.push('action');
        case 'TagChange':
          return this.replay.enqueue(null, 'receiveTagChange', {
            entity: parseInt(node.attributes.entity),
            tag: tagNames[node.attributes.tag],
            value: parseInt(node.attributes.value)
          });
        case 'GameEntity':
        case 'Player':
        case 'FullEntity':
        case 'ShowEntity':
          this.state.push('entity');
          this.entityDefinition.id = parseInt(node.attributes.entity || node.attributes.id);
          if (node.attributes.cardID) {
            this.entityDefinition.cardID = node.attributes.cardID;
          }
          if (node.attributes.name) {
            return this.entityDefinition.name = node.attributes.name;
          }
          break;
        case 'Options':
          return this.state.push('options');
        case 'ChosenEntities':
          this.chosen = {
            entity: node.attributes.entity,
            playerID: node.attributes.playerID,
            ts: tsToSeconds(node.attributes.ts),
            cards: []
          };
          return this.state.push('chosenEntities');
      }
    };

    HSReplayParser.prototype.chosenEntitiesState = function(node) {
      switch (node.name) {
        case 'Choice':
          return this.chosen.cards.push(node.attributes.entity);
      }
    };

    HSReplayParser.prototype.chosenEntitiesStateClose = function(node) {
      switch (node.name) {
        case 'ChosenEntities':
          this.state.pop();
          return this.replay.enqueue(this.chosen.ts, 'receiveChosenEntities', this.chosen);
      }
    };

    HSReplayParser.prototype.optionsStateClose = function(node) {
      switch (node.name) {
        case 'Options':
          this.state.pop();
          return this.replay.enqueue(tsToSeconds(node.attributes.ts), 'receiveOptions', node);
      }
    };

    HSReplayParser.prototype.entityState = function(node) {
      switch (node.name) {
        case 'Tag':
          return this.entityDefinition.tags[tagNames[parseInt(node.attributes.tag)]] = parseInt(node.attributes.value);
      }
    };

    HSReplayParser.prototype.entityStateClose = function(node) {
      var ts;
      if (node.attributes.ts) {
        ts = tsToSeconds(node.attributes.ts);
      } else {
        ts = null;
      }
      switch (node.name) {
        case 'GameEntity':
          this.state.pop();
          this.replay.enqueue(ts, 'receiveGameEntity', this.entityDefinition);
          return this.entityDefinition = {
            tags: {}
          };
        case 'Player':
          this.state.pop();
          this.replay.enqueue(ts, 'receivePlayer', this.entityDefinition);
          return this.entityDefinition = {
            tags: {}
          };
        case 'FullEntity':
          this.state.pop();
          this.replay.enqueue(ts, 'receiveEntity', this.entityDefinition);
          return this.entityDefinition = {
            tags: {}
          };
        case 'ShowEntity':
          this.state.pop();
          this.replay.enqueue(ts, 'receiveShowEntity', this.entityDefinition);
          return this.entityDefinition = {
            tags: {}
          };
      }
    };

    HSReplayParser.prototype.actionState = function(node) {
      switch (node.name) {
        case 'ShowEntity':
        case 'FullEntity':
          this.state.push('entity');
          this.entityDefinition.id = parseInt(node.attributes.entity || node.attributes.id);
          if (node.attributes.cardID) {
            this.entityDefinition.cardID = node.attributes.cardID;
          }
          if (node.attributes.name) {
            return this.entityDefinition.name = node.attributes.name;
          }
          break;
        case 'TagChange':
          return this.replay.enqueue(null, 'receiveTagChange', {
            entity: parseInt(node.attributes.entity),
            tag: tagNames[node.attributes.tag],
            value: parseInt(node.attributes.value)
          });
        case 'Action':
          this.state.push('action');
          return this.replay.enqueue(tsToSeconds(node.attributes.ts), 'receiveAction');
        case 'Choices':
          this.choices = {
            entity: parseInt(node.attributes.entity),
            max: node.attributes.max,
            min: node.attributes.min,
            playerID: node.attributes.playerID,
            source: node.attributes.source,
            ts: tsToSeconds(node.attributes.ts),
            cards: []
          };
          return this.state.push('choices');
      }
    };

    HSReplayParser.prototype.choicesState = function(node) {
      switch (node.name) {
        case 'Choice':
          return this.choices.cards.push(node.attributes.entity);
      }
    };

    HSReplayParser.prototype.choicesStateClose = function(node) {
      switch (node.name) {
        case 'Choices':
          this.state.pop();
          return this.replay.enqueue(this.choices.ts, 'receiveChoices', this.choices);
      }
    };

    HSReplayParser.prototype.actionStateClose = function(node) {
      var ts;
      if (node.attributes.ts) {
        ts = tsToSeconds(node.attributes.ts);
      } else {
        ts = null;
      }
      switch (node.name) {
        case 'Action':
          return this.state.pop();
      }
    };

    HSReplayParser.prototype.onOpenTag = function(node) {
      var name;
      this.stack.push(node);
      return typeof this[name = this.state[this.state.length - 1] + "State"] === "function" ? this[name](node) : void 0;
    };

    HSReplayParser.prototype.onCloseTag = function() {
      var name, node;
      node = this.stack.pop();
      return typeof this[name = this.state[this.state.length - 1] + "StateClose"] === "function" ? this[name](node) : void 0;
    };

    return HSReplayParser;

  })();

  module.exports = HSReplayParser;

}).call(this);
