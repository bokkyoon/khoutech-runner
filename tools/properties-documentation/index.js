#! /usr/bin/env node
const path = require('path');
const fs = require('fs')
const Mustache = require('mustache')
const yargs = require('yargs');

const argv = yargs
    .command( 'generate [config-file] [doc-file]',
              'Generate a adoc documentation from spring configuration json file', {
        configFile: {
            description: 'Spring configuration file ()',
            alias: 'c',
            type: 'string',
            default: 'spring-configuration-metadata.json'
        },
        docFile: {
          description: 'Spring configuration file ()',
          alias: 'd',
          type: 'string',
          default: 'documentation.adoc'
      }
    })
    .help()
    .alias('help', 'h')
    .argv;


const data = JSON.parse(fs.readFileSync(argv.configFile, 'utf8'))
const template = fs.readFileSync(path.dirname(require.main.filename) + '/documentation.adoc.mustache', 'utf8')

const sections = data.properties.map(property => {
    const section = property.name.split('.')[0];
    property.type = property.type.replace(/([a-z][A-Za-z0-9]+\.)+/, '').replace(/([a-z][A-Za-z0-9]+\.)+/, '').replace(/([a-z][A-Za-z0-9]+\.)+/, '').replace(/([A-Za-z0-9]+\.)+/, '')
    return Object.assign({section}, property);
  }).reduce((acc, property) => {
    const section = acc.find(s => s.section == property.section);
    if(section) {
      section.properties.push(property);
    } else {
      acc.push({
        section: property.section,
        properties: [property]
      });
    }
    return acc;
  }, []);

var output = Mustache.render(template, {sections});

fs.writeFileSync(argv.docFile, output);
