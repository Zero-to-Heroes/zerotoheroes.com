(function() {
  var Subscription;

  Subscription = (function() {
    Subscription.subscribe = function(emitter, event, callback) {
      return new Subscription(emitter, event, callback);
    };

    function Subscription(emitter1, event1, callback1) {
      var event, i, len, ref;
      this.emitter = emitter1;
      this.event = event1;
      this.callback = callback1;
      this.dead = false;
      ref = this.event.split(/\s+/);
      for (i = 0, len = ref.length; i < len; i++) {
        event = ref[i];
        this.emitter.on(event, this.callback);
      }
    }

    Subscription.prototype.off = function() {
      var event, i, len, ref;
      if (this.dead) {
        return;
      }
      ref = this.event.split(/\s+/);
      for (i = 0, len = ref.length; i < len; i++) {
        event = ref[i];
        this.emitter.removeListener(event, this.callback);
      }
      return this.dead = true;
    };

    Subscription.prototype.move = function(emitter) {
      var event, i, len, ref, results;
      this.off();
      this.emitter = emitter;
      this.dead = false;
      ref = this.event.split(/\s+/);
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        event = ref[i];
        results.push(emitter.on(event, this.callback));
      }
      return results;
    };

    return Subscription;

  })();

  module.exports = Subscription;

}).call(this);
