#! /usr/bin/env node
const { parser } = require('keep-a-changelog');
const fs = require('fs');
const chalk = require('chalk');


function getChangelog(filename, mode = 'r') {
    if (!fs.existsSync(filename)) {
        console.error(chalk.red('❌ Unable to find a changelog at ' + filename));
        throw new Error('Unable to find a changelog at ' + filename)
    }

    try {
        const text = fs.readFileSync(filename, 'UTF-8')
        const changelog = parser(text);

        return changelog;
    } catch (err) {
        console.error(chalk.red('❌ Changelog is wrong'));
        throw new Error(`Unable to read changelog: ${err.message}`);
    }
}

getChangelog((process.argv && process.argv.length > 2 && process.argv[2]) || 'CHANGELOG.md');

console.error(chalk.green('✅ Changelog is valid'));
process.exit(0);
