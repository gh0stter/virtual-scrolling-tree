define([
    "presenter",
    "text!./VirtualScrollingTree.html",
    "text!./VirtualScrollingTree.css"
], function (Presenter, template, style) {
    
    return Presenter.extend({

        template: template,
        style: style,

        init: function() {
            this.scrollPos = 0;

            this.canvas = this.el.querySelector("canvas");
            this.ctx = this.canvas.getContext("2d");
            window.addEventListener("resize", this.resize.bind(this), true);

            this.el.addEventListener("wheel", function(e) {
                this.scrollPos += e.deltaY;
                if (this.scrollPos < 0) {
                    this.scrollPos = 0;
                }
                draw.call(this);
            }.bind(this));
        },

        resize: function() {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.setAttribute("width", this.width);
            this.canvas.setAttribute("height", this.height);
            draw.call(this);
        }
    });



    function draw() {
        var colors = {
            sky: "#79CDCD",
            trunk: "#926239",
            grass: "#009900"
        };

        this.ctx.fillStyle = colors.sky;
        this.ctx.fillRect(0,0, this.width, this.height);


        // draw trunk
        var trunkWidth = 100;
        this.ctx.fillStyle = colors.trunk;
        this.ctx.fillRect(this.width / 2 - trunkWidth / 2, 0, trunkWidth, this.height);

        // draw branches
        var branchY;
        var branchHeight = 100;

        var drawLeftBranch = function() {
            var x = this.width / 2 - trunkWidth / 2 + 1;
            this.ctx.moveTo(x, branchY);
            this.ctx.lineTo(x - 80, branchY - branchHeight);
            this.ctx.lineTo(x, branchY - 30);
        }.bind(this);

        var drawRightBranch = function() {
            var x = this.width / 2 + trunkWidth / 2 - 1;
            this.ctx.moveTo(x, branchY);
            this.ctx.lineTo(x + 80, branchY - branchHeight);
            this.ctx.lineTo(x, branchY - 30);
        }.bind(this);

        var bottomOfTree = 200;

        // calcuate the position of the bottom most branch 
        branchY = this.height;
        var offset = this.scrollPos % 100;
        branchY += offset;
        var branchIndex = Math.floor(this.scrollPos / 100);

        while (branchY > 0) {
            this.ctx.fillStyle = colors.trunk;
            this.ctx.beginPath();
            if (branchIndex % 2) {
                drawRightBranch();
            } else {
                drawLeftBranch();
            }
            branchIndex++;
            branchY -= 100;
            this.ctx.fill();
        }

        // Grass
        var grassHeight = 100;
        if (this.scrollPos < grassHeight) {
            this.ctx.fillStyle = colors.grass;
            this.ctx.fillRect(0, this.height - (grassHeight - this.scrollPos), this.width, grassHeight - this.scrollPos);
        }
    }


});