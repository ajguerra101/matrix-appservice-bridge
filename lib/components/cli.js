"use strict";
var ConfigValidator = require("./config-validator");
var fs = require("fs");
var nopt = require("nopt");
var path = require("path");
var yaml = require("js-yaml");

/**
 * @constructor
 * @param {Object} opts CLI options
 * @param {boolean} opts.enableConfig Enable '--config'. Default True.
 * @param {boolean} opts.enableRegistration Enable '--generate-registration'.
 * Default True.
 * @param {string|Object=} opts.configSchema Path to a schema YAML file (string)
 * or the parsed schema file (Object).
 * @param {Object} opts.configDefaults The default options for the config file.
 */
function Cli(opts) {
    this.opts = opts || {};
    if (this.opts.enableRegistration === undefined) {
        this.opts.enableRegistration = true;
    }
    if (this.opts.enableConfig === undefined) {
        this.opts.enableConfig = true;
    }
}

/**
 * Run the app from the command line. Will parse sys args.
 */
Cli.prototype.run = function() {
    var opts = nopt({
        "generate-registration": Boolean,
        "config": path,
        "help": Boolean
    }, {
        "c": "--config",
        "r": "--generate-registration",
        "h": "--help"
    });

    if (this.opts.enableRegistration && opts["generate-registration"]) {
        this._generateRegistration();
        process.exit(0);
        return;
    }

    if (opts.help || (this.opts.enableConfig && !opts.config)) {
        this._printHelp();
        process.exit(0);
        return;
    }

    var configFile = (this.opts.enableConfig && opts.config) ? opts.config : null;
    var config = this._loadConfig(configFile);
    this._startWithConfig(config);
};

Cli.prototype._loadConfig = function(filename) {
    if (!filename) { return {}; }
    console.log("Loading config file %s", filename);
    var cfg = this._loadYaml(filename);
    if (typeof cfg === "string") {
        throw new Error("Config file " + filename + " isn't valid YAML.");
    }
    if (!this.opts.configSchema) {
        return cfg;
    }
    var validator = new ConfigValidator(this.opts.configSchema);
    return validator.validate(cfg, this.opts.configDefaults);
};

Cli.prototype._generateRegistration = function() {
    console.log("Generating registration");
};

Cli.prototype._startWithConfig = function(config) {
    console.log("Starting up...");
    console.log(JSON.stringify(config));
};

Cli.prototype._loadYaml = function(fpath) {
    return yaml.safeLoad(fs.readFileSync(fpath, 'utf8'));
};

Cli.prototype._printHelp = function() {
    var help = {
        "--help -h": "Display this help message"
    };
    var appPart = (process.argv[0] === "node" ?
        (process.argv[0] + " " + process.argv[1]) :
        process.argv[0]
    );
    var usages = [];

    if (this.opts.enableRegistration) {
        help["--generate-registration -r"] = "Create a registration YAML file " +
        "for this application service";
        usages.push("-r");
    }
    if (this.opts.enableConfig) {
        help["--config -c"] = "The config file to load";
        usages.push("-c CONFIG_FILE");
    }
    else {
        usages.push("");
    }

    console.log("Usage:");
    usages.forEach(function(usage) {
        console.log("%s %s", appPart, usage);
    });

    console.log("\nOptions:");
    Object.keys(help).forEach(function(k) {
        console.log("  %s", k);
        console.log("      %s", help[k]);
    });
};

module.exports = Cli;