/**
 * The Tree instantiates Items to display data. Items have an expander
 * and label. Clicking the expander tells the Tree to update the data
 * and items are updated accordingly.
 *
 * @class Item
 * @private
 */
define([
    "presenter",
    "text!./Item.html",
    "text!./Item.css",
    "../eventbus/EventBus"
], function (Presenter, template, style, EventBus) {
    
    return Presenter.extend({

        template: template,
        style: style,

        /**
         * Instantiates variables and prepares the view.
         *
         * @method init
         * @private
         */
        init: function(options) {
            this._eventBus = new EventBus();
            this._expanded = options.expanded;
            this._data = options.data;

            prepareView.call(this);
            applyExpanderIcon.call(this);
            applyExpanderEvent.call(this);

            this._view.label.textContent = options.data.label;
            this.el.style.paddingLeft = options.indent * 20 + "px";
        },

        /**
         * Delegates to EventBus subscribe method.
         *
         * @method on
         */
        on: function() {
            return this._eventBus.subscribe.apply(this._eventBus, arguments);
        },

        /**
         * Delegates to EventBus unsubscribe method.
         *
         * @method off
         */
        off: function() {
            return this._eventBus.unsubscribe.apply(this._eventBus, arguments);
        },

        /**
         * Delegates to EventBus publish method.
         *
         * @method trigger
         */
        trigger: function() {
            return this._eventBus.publish.apply(this._eventBus, arguments);
        }

    });

    /**
     * Sets up shortcut properties to access the DOM elements.
     *
     * @method prepareView
     * @private
     */
    function prepareView() {
        this._view = {
            expander: this.el.querySelector(".VirtualScrollingTree-Item-expander"),
            label: this.el.querySelector(".VirtualScrollingTree-Item-label")
        };
    }

    /**
     * Adds the click handler for the expander icon which changes the expanded
     * status of the item and triggers an event to let the Tree know it expanded
     * so that it can update accordingly.
     *
     * @method applyExpanderEvent
     * @private
     */
    function applyExpanderEvent() {
        if (this._data.children) {
            this._view.expander.addEventListener("click", function() {
                this._expanded = !this._expanded;
                applyExpanderIcon.call(this);
                this.trigger("toggle", this._data);
            }.bind(this), true);
        }
    }

    /**
     * Updates the expander icon based on the expanded status of the item.
     *
     * @method applyExpanderIcon
     * @private
     */
    function applyExpanderIcon() {
        if (this._data.children) {
            // Apply the unicode symbols for squared plus/minus to the attribute.
            // We're assigning it to an attribute so that we can access the content
            // via CSS in the before pseudo class. By applying it like this, we can
            // prevent user selection and avoid using non-standard user-select CSS.
            var icon = this._expanded? "\u229f" : "\u229e";
            this._view.expander.setAttribute("data-expander-icon", icon);
        }
        
    }

})