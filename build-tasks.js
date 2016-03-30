var optimizer = require("lamda-optimizer");
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
    case "optimize":
        var config = parseConfig();
        config.header = "/*\n" +fs.readFileSync("LICENSE", "utf8") + "\n*/";
        config.minify = true;
        optimizer(config, "./", function(){});
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
        } else if (versionType === "minor") {
            currVersion[1]++;
        } else {
            currVersion[2]++;
        }

        packageJson.version = currVersion.join(".");
        fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 4));
        console.log("New Version: " + packageJson.version);
        break;
}