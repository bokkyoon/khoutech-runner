#! /usr/bin/env node
const yaml = require('js-yaml');
const fs   = require('fs');
const program = require('commander');
const mustache = require('mustache');
const moment = require('moment');

program
  .requiredOption('-p, --properties <file>', 'properties file')
  .requiredOption('-d, --documentation <file>', 'documentation file');

program.version('0.0.1');

program.parse(process.argv);

const propertiesFilename = program.properties;
const documentationFilename = program.documentation;

var properties = yaml.safeLoad(fs.readFileSync(propertiesFilename, 'utf8'));
var documentation = yaml.safeLoad(fs.readFileSync(documentationFilename, 'utf8'));


var findUndocumentedProperties = function(properties, documentation) {
    var findProperties = function(key, obj) {
        return key.split('.').reduce((o,i)=>o[i], obj);
    };

    var get = function(str, object) {
        if(typeof object == "object") {
            return Object.keys(object)
                .map(k => {
                    return get((str == "--" ? "" : str + ".") + k, object[k]);
                })
                .join("|");
        } else {
            return str;
        }
    }
    
    var p = get("--", properties).split("|");

    return p.filter(p => {
        try{return findProperties(p + ".description", documentation) == undefined} catch(e) { return true;};
    });
};

undocumentedProperties = findUndocumentedProperties(properties, documentation);

if(undocumentedProperties.length > 0 ){
	console.error("Undocumented properties are", undocumentedProperties);
	process.exit(1);
}
else{
	console.log("All properties are documented");
	process.exit(0);
}
