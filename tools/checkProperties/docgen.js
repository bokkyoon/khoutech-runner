#! /usr/bin/env node
const path = require('path');
const yaml = require('js-yaml');
const fs   = require('fs');
const program = require('commander');
const mustache = require('mustache');
const moment = require('moment');

program
    .requiredOption('-m, --module <module_name>', 'module name (risk-manager)')
    .requiredOption('-d, --documentation <file>', 'file path of documentation file (doc/risk-manager.yml)')
    .option('-t, --template <type>', 'path to documentation template', path.dirname(require.main.filename) + '/documentation.adoc.mustache')
    .option('-o, --output <type>', 'path to output asciidoc', '.');

program.version('0.0.1');

program.parse(process.argv);

const documentationFilename = program.documentation;
const moduleName = program.module;

var documentation = yaml.safeLoad(fs.readFileSync(documentationFilename, 'utf8'));


var documentationToMustacheFormat = function(documentation) {
    var findProperties = function(key, obj) {
        return key.split('.').reduce((o,i)=>o[i], obj);
    };

    var recursion = function(str, object) {
        if(typeof object == "object") {
            return Object.keys(object)
                .map(k => {
                    return recursion((str == "--" ? "" : str + ".") + k, object[k]);
                })
                .join("|");
        } else {
            return str;
        }
    }
    
    var allPointStrings = recursion("--", documentation).split("|");

    var descriptionPointStrings = allPointStrings.filter(str => {
        return str.endsWith(".description");
    });

    var allPropertiesPointStrings = descriptionPointStrings.map(str => {
        var lastPoint = str.lastIndexOf(".");
        return str.substring(0,lastPoint);
    });

    var mustacheFormat = allPropertiesPointStrings.map(str => {
        return {
            "property": str,
            "description": findProperties(str + ".description", documentation),
            "type": findProperties(str + ".type", documentation),
            "mandatory": findProperties(str + ".mandatory", documentation),
            "example": findProperties(str + ".example", documentation)
        };
    })

    return mustacheFormat;
};

var documentationMustacheFormat = documentationToMustacheFormat(documentation);

const documentationStr = mustache.render(fs.readFileSync(program.template, "utf8"), {
    module: moduleName,
    date: moment().format('DD-MM-YYYY'),
    properties: documentationMustacheFormat
});

var outputAsciiDoc = program.output + '/' + moduleName + ".adoc";
fs.writeFileSync(outputAsciiDoc, documentationStr);

console.log("Documentation has been generated for " + moduleName);