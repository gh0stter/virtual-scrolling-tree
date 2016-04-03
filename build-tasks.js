var optimizer = require("lamda-optimizer");
var fork = require('child_process').fork;
var fs = require("fs");

var task = process.argv[2];

function parseConfig() {
    var code = fs.readFileSync("require.config.js", "utf8");
    eval(code);
    return require;
}

function parsePackageJson() {
    return JSON.parse(fs.readFileSync("package.json", "utf8"));
}

switch(task) {
    case "test": 
        var express = require("express");
        var app = express();
        app.use('/', express.static(__dirname));
        app.use(function (req, res) {
            res.status(404).send("File Not Found");
        });
        var server = app.listen(8585, function() {
            var tester = fork("node_modules/mocha-phantomjs/bin/mocha-phantomjs", ["http://127.0.0.1:8585/test/index.html"]);
            tester.on("exit", function(code) {
                process.exit(code);
            });
        });
        break;

    case "optimize":
        var config = parseConfig();
        config.header = "/*\n" +fs.readFileSync("LICENSE", "utf8") + "\n*/";
        config.minify = true;

        var vstConfig = JSON.parse(JSON.stringify(config));
        vstConfig.modules = [{
            name: "virtual-scrolling-tree",
            location: "virtual-scrolling-tree/VirtualScrollingTree",
            exclude: ["text", "presenter"]
        }]
        optimizer(vstConfig, "target", function(){});

        // var ctConfig = JSON.parse(JSON.stringify(config));
        // ctConfig.modules = [{
        //     name: "canvas-virtual-scrolling-tree",
        //     location: "canvas-virtual-scrolling-tree/VirtualScrollingTree",
        //     exclude: ["text", "presenter"]
        // }];
        // optimizer(ctConfig, "target/demo/canvas-vst", function(){})
        break;

    case "get-version":
        console.log(parsePackageJson().version);
        break;

    case "update-version":
        var packageJson = parsePackageJson();
        var versionType = process.argv[3];
        var currVersion = packageJson.version.match(/\d+/g).map(function(value) {
            return parseInt(value, 10);
        });
        console.log("Old Version: " + packageJson.version);

        if (versionType === "major") {
            currVersion[0]++;
            currVersion[1] = 0;
            currVersion[2] = 0;
        } else if (versionType === "minor") {
            currVersion[1]++;
            currVersion[2] = 0;
        } else {
            currVersion[2]++;
        }

        packageJson.version = currVersion.join(".");
        fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 4));
        console.log("New Version: " + packageJson.version);
        break;
}