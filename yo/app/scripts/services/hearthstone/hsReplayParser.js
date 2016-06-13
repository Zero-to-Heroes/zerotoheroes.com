var services = angular.module('services');
services.factory('HsReplayParser', ['$log', 
	function ($log) {

		var service = {}

		service.getPlayerInfo = function(replayXml) {
			var playerInfo = {
				player: {},
				opponent: {}
			}

			$log.debug('parsing replay', replayXml)
			var players = replayXml.getElementsByTagName('Player')
			$log.debug('players', players)
			playerInfo.player.name = players[0].getAttribute('name')
			playerInfo.opponent.name = players[1].getAttribute('name')
			$log.debug('first playerInfo', playerInfo)


			// Get class
			playerInfo.player.class = extractClassCard(replayXml, players[0])
			playerInfo.opponent.class = extractClassCard(replayXml, players[1])

			$log.debug('built playerInfo', playerInfo)
			

			return playerInfo
		}

		var extractClassCard = function(replayXml, player) {
			$log.debug('building playerClass for ', player, replayXml)
			var playerId
			var nodes = player.childNodes
			$log.debug('\tchildNodes ', nodes)
			for (var i = 0; i < nodes.length; i++) {
				var node = nodes[i]
				if (node.nodeName == 'Tag' && node.getAttribute('tag') == '27') {
					playerId = node.getAttribute('value')
				}
			}
			$log.debug('playerId', playerId)

			var cardId
			var entities = replayXml.getElementsByTagName('FullEntity')
			$log.debug('entities', entities.length, entities)
			for (var i = 0; i < entities.length; i++) {
				var entity = entities[i]
				if (entity.getAttribute('id') == playerId) {
					cardId = entity.getAttribute('cardID')
				}
			}
			$log.debug('cardId', cardId)

			var playerClass = window['parseCardsText'].getCard(cardId).playerClass.toLowerCase()
			$log.debug('playerClass', playerClass)
			return playerClass
		}

		return service
	}
])