(function() {
  var Subscription, SubscriptionList;

  Subscription = require('./subscription');

  SubscriptionList = (function() {
    function SubscriptionList() {
      this.dead = false;
      this.subscriptions = [];
    }

    SubscriptionList.prototype.add = function(emitter, event, callback) {
      var subscription;
      this.dead = false;
      if (emitter instanceof Subscription || emitter instanceof SubscriptionList) {
        this.subscriptions.push(emitter);
        return emitter;
      } else {
        subscription = new Subscription(emitter, event, callback);
        this.subscriptions.push(subscription);
        return subscription;
      }
    };

    SubscriptionList.prototype.off = function() {
      var i, len, ref, sub;
      if (this.dead) {
        return;
      }
      ref = this.subscriptions;
      for (i = 0, len = ref.length; i < len; i++) {
        sub = ref[i];
        sub.off();
      }
      return this.dead = true;
    };

    return SubscriptionList;

  })();

  module.exports = SubscriptionList;

}).call(this);
