var services = angular.module('services');
services.factory('HsReplayParser', ['$log', 
	function ($log) {

		var service = {}

		service.getPlayerInfo = function(replayXml) {
			var playerInfo = {
				player: {},
				opponent: {}
			}

			var players = replayXml.getElementsByTagName('Player')
			playerInfo.player.name = players[0].getAttribute('name')
			playerInfo.opponent.name = players[1].getAttribute('name')

			// Get class
			playerInfo.player.class = extractClassCard(replayXml, players[0])
			playerInfo.opponent.class = extractClassCard(replayXml, players[1])

			// console.log('built playerInfo', playerInfo)
			

			return playerInfo
		}

		var extractClassCard = function(replayXml, player) {
			// console.log('building playerClass for ', player, replayXml)
			var playerId
			var nodes = player.childNodes
			nodes.forEach(function(node) {
				if (node.nodeName == 'Tag' && node.getAttribute('tag') == '27') {
					playerId = node.getAttribute('value')
				}
			})
			// console.log('playerId', playerId)

			var cardId
			var entities = replayXml.getElementsByTagName('FullEntity')
			// console.log('entities', entities.length, entities)
			for (var i = 0; i < entities.length; i++) {
				var entity = entities[i]
				if (entity.getAttribute('id') == playerId) {
					cardId = entity.getAttribute('cardID')
				}
			}
			// console.log('cardId', cardId)

			var playerClass = window['parseCardsText'].getCard(cardId).playerClass.toLowerCase()
			// console.log('playerClass', playerClass)
			return playerClass
		}

		return service
	}
])