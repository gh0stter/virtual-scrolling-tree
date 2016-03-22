define([
    "presenter",
    "text!./VirtualScrollingTree.html"
], function (Presenter, template) {
    
    return Presenter.extend({

        template: template,

        init: function() {
            console.log("init");
        }

    })

})