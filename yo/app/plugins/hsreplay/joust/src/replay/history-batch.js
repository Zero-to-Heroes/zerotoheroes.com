(function() {
  var HistoryBatch;

  HistoryBatch = (function() {
    function HistoryBatch(timestamp, command) {
      this.timestamp = timestamp;
      this.commands = [command];
    }

    HistoryBatch.prototype.addCommand = function(command) {
      return this.commands.push(command);
    };

    HistoryBatch.prototype.execute = function(replay) {
      var command, i, len, ref;
      ref = this.commands;
      for (i = 0, len = ref.length; i < len; i++) {
        command = ref[i];
        if (command[0] === null) {
          continue;
        }
        replay[command[0]].apply(replay, command[1]);
      }
    };

    return HistoryBatch;

  })();

  module.exports = HistoryBatch;

}).call(this);
