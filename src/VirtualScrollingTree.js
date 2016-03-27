define([
    "presenter",
    "text!./VirtualScrollingTree.html",
    "text!./VirtualScrollingTree.css",
    './item/Item',
    './eventbus/EventBus'
], function (Presenter, template, style, Item, EventBus) {
    
    var ITEM_HEIGHT = 32;

    return Presenter.extend({

        template: template,
        style: style,

        init: function(options) {
            this._items = [];
            this._eventBus = new EventBus();
            this._expansions = [{
                id: null,
                children: options.totalRootItems,
                offset: 0,
                expansions: []
            }];
            this._getData = options.getData;
            window.addEventListener("resize", this.redraw.bind(this), true);
            prepareView.call(this);
        },

        redraw: function() {
            requestData.call(this);
        },

        on: function() {
            return this._eventBus.subscribe.apply(this._eventBus, arguments);
        },

        off: function() {
            return this._eventBus.unsubscribe.apply(this._eventBus, arguments);
        },

        trigger: function() {
            return this._eventBus.publish.apply(this._eventBus, arguments);
        }
    });

    /**
     * Creates a shortcut view object which we can use to access
     * our DOM elements. Also sets up event handlers for the content.
     *
     * @method prepareView
     * @private
     */
    function prepareView() {
        this._view = {
            content: this.el.querySelector(".VirtualScrollingTree-content"),
            scrollbar:  this.el.querySelector(".VirtualScrollingTree-scrollbar"),
            scrollbarContent: this.el.querySelector(".VirtualScrollingTree-scrollbarContent")
        };

        // Scrolling either the content with the middle mouse wheel, or manually
        // scrolling the scrollbar directly should accomplish the same thing.
        this._view.scrollbar.addEventListener("scroll", requestData.bind(this), true);
        this._view.content.addEventListener("wheel", function(e) {
            this._view.scrollbar.scrollTop += e.deltaY;
        }.bind(this), true);
    }    

    /**
     * Updates the width of the tree to match its containing element.
     *
     * @method updateViewDimensions
     * @private
     */
    function updateViewDimensions(totalItems) {
        var scrollbarWidth = getNativeScrollbarWidth();
        this._view.content.style.width = this.el.offsetWidth - scrollbarWidth - 1 + "px";
        this._view.scrollbar.style.width = scrollbarWidth + 1 + "px";
        this._view.scrollbarContent.style.height = totalItems * 32 + "px";

        var visibleItems = Math.floor(this.el.offsetHeight / ITEM_HEIGHT);
        this._view.content.style.height = visibleItems * ITEM_HEIGHT + "px";
        this._view.scrollbar.style.height = visibleItems * ITEM_HEIGHT + "px";
    }

    /**
     * Creates a div which is used to calculate the width
     * of the scrollbar for the current browser.
     *
     * @method getNativeScrollbarWidth
     * @private
     * @return {number}
     */
    function getNativeScrollbarWidth() {
        var outer = document.createElement("div");
        outer.style.overflowY = "scroll";
        outer.style.visibility = "hidden";
        outer.style.width = "100px";
        document.body.appendChild(outer);
        var content = document.createElement("div");
        outer.appendChild(content);
        var width = 100 - content.offsetWidth;
        document.body.removeChild(outer);
        return width;
    }

     /**
     * Builds query, and triggers the getData call for the developer.
     * When the developer calls success the data of the tree gets updated.
     *
     * @method requestData
     * @private
     */
    function requestData() {
        var visible = Math.floor(this.el.offsetHeight / ITEM_HEIGHT);
        var scrollIndex = Math.ceil(this._view.scrollbar.scrollTop / ITEM_HEIGHT);
        var request = buildRequest.call(this, scrollIndex, visible);
        this._request = request;
        this._getData(request, setData.bind(this));
    }

    /**
     * Figures out where to draw all of the items based on expanded, scroll position
     * and other pieces of information.
     *
     * @method setData
     * @private
     * @param {Array<Object>} data
     */
    function setData(data) {
        var output = [];

        // Wipe out all of the current items since we don't need them anymore.
        // Easier code wise to just re-instantiate everything and doesn't impact performance.
        while(this._items.length) {
            this._items.pop().detach();
        }

        // Calculate the total height that the scrollbar should be based on the root nodes
        // and all of the items that have been expanded so far.
        var totalHeight = 0;
        forEachExpansion(this._expansions, function(expansion) {
            totalHeight += expansion.children;
        });

        updateViewDimensions.call(this, totalHeight);

        // Apply the offsets to the items which is used to keep track of expansions.
        // By ensuring the data has the offset applied to them, we can calculate from
        // here exactly which items are above us and which ones are below us when we 
        // look at the position of the virtual scrollbar.
        for (var i = 0; i < data.length; i++) {
            for (var j = 0; j < data[i].items.length; j++) {
                data[i].items[j].offset = this._request[i].offset + j;
            }
        }

        // The response from the server should be in a heirarchical structure.
        // This means that we can iterate over this array, and the further we are in the array
        // the deeper the level we're in. 
        //
        // Eg. [null, 1, 1, 2, 3, 3]
        data.forEach(function(response) {
            var index = output.findIndex(function(obj) {
                return obj.id === response.parent;
            });

            if (index > -1) {
                // If the parent exists, we insert the items directly below it.
                output = output.slice(0, index + 1)
                            .concat(response.items)
                            .concat(output.slice(index + 1));
            } else {
                // If the parent doesn't exist, we prepend. We prepend because of this scenario:
                //
                //       Item 1.1.1
                //    Item 1.2
                //    Item 1.3
                //    Item 1.4
                // Item 2
                // Item 3
                // 
                // In this scenario, we've expanded Item 1, but because it doesn't exist in the output
                // we can only assume it's directly above us. We've also expanded Item 1.1, and again
                // because it's parent isn't visible, and because we know the data is in a heirarchical 
                // structure, we can prepend it.
                output = response.items.concat(output);
            }
        });

        // Once we've figured out the output, start rendering them
        output.forEach(function(data) {
            var item = new Item({
                data: data,
                expanded: isExpanded.call(this, data.id),
                indent: calculateLevel.call(this, data)
            });
            item.attach(this._view.content);
            this._items.push(item);

            // When we hit the expander icon
            item.on("toggle", function(data) {
                // Check to see if this item is expanded or not
                var expanded = isExpanded.call(this, data.id);
                if (expanded) {
                    collapseItem.call(this, data);
                } else {
                    expandItem.call(this, data);
                }

                // Each time we expand or collapse we need to re-request data.
                requestData.call(this);
            }.bind(this));
        }.bind(this));
    }

    /**
     * Recursively iterate over the expansions and 
     * execute the passed callback against it.
     *
     * @method forEachExpansion
     * @private
     * @param {Array<Object>} expansions
     * @param {Functin} fn
     */
    function forEachExpansion(expansions, fn) {
        var impl = function(expansions) {
            expansions.forEach(function(expansion) {
                fn(expansion);
                impl(expansion.expansions);
            });
        };

        impl(expansions);
    }

    /**
     * Finds the expansion with the id specified.
     *
     * @method findExpansion     
     * @private
     * @param {String} id
     * @return {Object}
     */
    function findExpansion(id) {
        var result;

        forEachExpansion(this._expansions, function(expansion) {
            if (expansion.id === id) {
                result = expansion;
            }
        });

        return result; 
    }

    /**
     * Calculates how deep the item is in the tree.
     *
     * @method calculateLevel
     * @private
     * @param {Object} item
     * @return {Number} level
     */
    function calculateLevel(item) {
        return findExpansion.call(this, item.parent, this._expansions)._level;
    }

    /**
     * If expanded, index in expansions array is returned.
     * If not expanded, -1 is returned.
     *
     * @method isExpanded
     * @private
     * @param {String} id
     * @return {Number} index
     */
    function isExpanded(id) {
        return findExpansion.call(this, id) !== undefined;
    }

    /**
     * Removes item to list of expansions.
     *
     * @method collapseItem
     * @private
     * @params {Object} data
     */
    function collapseItem(data) {
        var parentExpansions = findExpansion.call(this, data.parent).expansions;

        var index = parentExpansions.findIndex(function(expansion) {
            return expansion.id === data.id;
        });

        parentExpansions.splice(index, 1);
    }

    /**
     * Adds item to list of expansions.
     *
     * @method expandItem
     * @private
     * @params {Object} data
     */
    function expandItem(data) {
        // Cloning to avoid modification of the original data item.
        data = JSON.parse(JSON.stringify(data));

        if (!data.expansions) {
            data.expansions = [];
        }

        // Expansions are stored in a tree structure.
        var obj = findExpansion.call(this, data.parent);
        obj.expansions.push(data);
    }

    /**
     * Sorting expansions makes the query more accurate.
     *
     * @method sortExpansions
     * @private
     */
    function sortExpansions() {
        var impl = function(expansions) {
            expansions.sort(function(a, b) {
                return a.offset - b.offset;
            });
            
            for (var i = 0; i < expansions.length; i++) {
                impl(expansions[i].expansions);
            }
        }

        impl(this._expansions);
    }

    /**
     * Sorts and calculates the scroll indexes for the expansions.
     *
     * @method calculateExpansions
     * @private
     */
    function calculateExpansions() {
        var impl = function(expansions, parentStart, parentLevel) {
            expansions.forEach(function(expansion, index) {
                expansion._level = parentLevel;

                // We need to calculate the start position of this expansion. The start
                // position isn't just the offset of the item relative to the parent, but
                // also takes into account expanded items above it. 
                //
                // One easy way to do this is to just check the previous item and get its end index.
                // We fetch the one on the same level not above or below. That should in theory
                // already have a start/end relative to the parent. If there isn't a previous sibling
                // then we will take the parent start value. Add onto this the offset for the item
                // and we've got our starting value.
                //
                // eg. 
                //   Item 1 <-- start 0, end 0
                //   Item 2 <-- start 2, end 8
                //       Item 2.1 <-- start 3, end 3
                //          Item 2.1.1
                //       Item 2.2
                //       Item 2.3 <-- start 6, end 6
                //          Item 2.3.1
                //       Item 2.4 <-- start 8, end 8
                //          Item 2.4.1 
                //   Item 3
                //   Item 4 <-- start 11, end 12
                //       Item 4.1
                //       Item 4.2
                var start, end;
                var prevSibling = expansions[index - 1];
                if (prevSibling) {
                    start = prevSibling._end + 1 + (expansion.offset - prevSibling.offset);
                } else {
                    start = parentStart + 1 + expansion.offset;
                }

                expansion._start = start;

                // To calculate the ending, we recursively add the children
                // for this expansion, and that will be added to the start value.
                var totalChildren = expansion.children;
                forEachExpansion(expansion.expansions, function(expansion) {
                    totalChildren += expansion.children;
                });

                // We add the children and substract one. We subtract one because
                // the start is one of the children.
                expansion._end = expansion._start + totalChildren - 1;

                // Repeat this recursively for all of the nested expansions.
                // The nested expansions will have a relative start to this 
                // expansion.
                impl(expansion.expansions, expansion._start, parentLevel + 1);
            });
        }

        impl(this._expansions, -1, 0);
    }

    /**
     * Calculates what's in the viewport and generates a series
     * of queries for the developer to respond to.
     *
     * @method buildRequest
     * @private
     */
    function buildRequest(scrollPos, viewport) {
        // Variables
        var queries = [];
        var requestedTotal = 0;
        var expanded = this._expansions;

        sortExpansions.call(this);
        calculateExpansions.call(this);

        // One-dimensional collision detection. 
        // It checks to see if start/end are both either before 
        // the viewport, and after. If it's not before or after, it's colliding.
        var inViewPort = function(v1, v2, e1, e2) {
            return !((e1 < v1 && e2 < v1) || (e1 > v2 && e2 > v2));
        };

        var calculateExpansionQueries = function(expansions, parentQuery) {

            expansions.forEach(function(e) {

                if (inViewPort(scrollPos, scrollPos + viewport, e._start, e._end)) {
                    
                    // We want to find out how many items for this expansion are 
                    // visible in the view port. To do this we find the first item that's
                    // visible, the last item that's visible, subtract them and cap it to the viewport size.
                    var start = Math.max(scrollPos, e._start);
                    var end = Math.min(scrollPos + viewport - 1, e._end);
                    var visible = Math.max(0, Math.min(end - start + 1, viewport));

                    if (parentQuery) {
                        // If there are nested children visible, we need to subtract 
                        // this from the parent. Note that visible also includes any expanded
                        // children nested further because we're using the _start and _end 
                        // values we've already calculated.
                        parentQuery.limit -= visible;

                        if (scrollPos > e._start) {
                            var notVisible = (e._end - e._start + 1) - visible;
                            if (notVisible > 0) {
                                parentQuery.offset -= notVisible;
                            }
                        }
                    }

                    // This query object is what's given to the end user.
                    // The parent represents who we want the children of.
                    // The offset is based on how much we've scrolled past the beginning.
                    // The limit is total items that are visible in the viewport.
                    var query = {
                        parent: e.id,
                        offset: scrollPos > e._start? scrollPos - e._start : 0,
                        limit: Math.min(visible, viewport)
                    };

                    queries.push(query);
                    calculateExpansionQueries(e.expansions, query);
                } else if (scrollPos > e._end && parentQuery) {
                    // If we've completely scrolled past this object, just substract all of its expanded children from the parent offset.
                    parentQuery.offset -= (e._end - e._start + 1);
                }
                
            });
        };
        
        calculateExpansionQueries(this._expansions);
        return queries;

    }



});