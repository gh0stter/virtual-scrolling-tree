/**
 * Simple EventBus pattern with subscribe, unsubscribe and publishing functionality.
 *
 * @class EventBus
 * @private
 */
define(function() {

    var idGenerator = 0;

    var EventBus = function() {
        this._subscribers = {};
    };

    /**
     * Creates a subscription to the specified channel name.
     * The callback is triggered and receives data for the event
     * as arguments. A handle is returned which can be used for 
     * unsubscribing from the channel.
     *
     * @method subscribe
     * @param {String} name
     * @param {Function} callback
     * @return {Object} handle
     */
    EventBus.prototype.subscribe = function(name, callback) {
        if (!this._subscribers[name]) {
            this._subscribers[name] = [];
        }

        var handle = {
            __id: idGenerator++,
            __fn: callback,
            __name: name
        };

        this._subscribers[name].push(handle);
        return handle;
    };

    /**
     * Uses the handle to find a subscription and removes
     * the subscription.
     *
     * @method unsubscribe
     * @param {Object} handle
     */
    EventBus.prototype.unsubscribe = function(handle) {
        for (var name in this._subscribers) {
            var subs = this._subscribers[name];
            for (var i = 0; i < subs.length; i++) {
                if (subs[i].__id === handle.__id) {
                    subs.splice(i, 1);
                    return;
                }
            }
        } 
    };

    /**
     * Triggers callbacks for the specified channel name
     * and passes the remaining arguments as data into the 
     * channel callbacks.
     *
     * @method publish
     * @param {String} name
     * @param {Any} data...
     */
    EventBus.prototype.publish = function(name) {
        var args = Array.prototype.slice.call(arguments, 1);

        var subs = this._subscribers[name];
        if (subs) {
            subs.forEach(function(sub) {
                sub.__fn.apply(null, args);
            });
        } 
    };

    return EventBus;

});