#! /usr/bin/env node
const program = require('commander');
const { parser, Release } = require('keep-a-changelog');
const fs = require('fs');
const chalk = require('chalk');

const write = program.command('log');

write
  .command('add <message>')
  .option('-r, --release <release>', 'Write for specific version')
  .action((message, option) => {
    add('add', message, option);
  });

write
  .command('fix <message>')
  .option('-r, --release <release>', 'Write for specific version')
  .action((message, option) => {
    add('fix', message, option);
  });

const releaseCmd = program.command('release  <releaseVersion>');

releaseCmd
    .description('Make a release from unreleased bloc')
    .action(release);

program.command('lint')
    .description('Linter on CHANGELOG.md')
    .action(lint);

program.on('command:*', function () {
    program.help();
});

program.parse(process.argv);


function release(version) {
    const changelog = parser(fs.readFileSync('CHANGELOG.md', 'UTF-8'));
    let release = changelog.findRelease()
    if(release) {
        release.setVersion(version);
        release.setDate(new Date());
    }
    fs.writeFileSync('CHANGELOG.md', changelog.toString(), 'UTF-8');
    console.error(chalk.green('✅ All unreleased message are updated on version ' + version));
}

function add(type, msg, options) {
    const changelog = parser(fs.readFileSync('CHANGELOG.md', 'UTF-8'));
    
    let release = changelog.findRelease(options.release)
    if(!release) {
        if(options.release) {
            release = new Release(options.release, new Date())
        } else {
            release = new Release()
        }
        changelog.addRelease(release);
    }

    switch (type) {
        case 'add':
            release.added(msg);
            break;
        case 'fix':
            release.fixed(msg);
            break;
        case 'change':
            release.changed(msg);
            break;
        case 'delete':
            release.deleted(msg);
            break;
        default:
            break;
    }
    
    fs.writeFileSync('CHANGELOG.md', changelog.toString(), 'UTF-8');
    console.error(chalk.green('✅ Message added into changelog'));
}


function lint() {
    const filename = 'CHANGELOG.md';
    if (!fs.existsSync(filename)) {
        console.error(chalk.red('❌ Unable to find a changelog at ' + filename));
        throw new Error('Unable to find a changelog at ' + filename)
    }

    try {
        const text = fs.readFileSync(filename, 'UTF-8')
        const changelog = parser(text);

        console.error(chalk.green('✅ Changelog is valid'));
        process.exit(0);
    } catch (err) {
        console.error(chalk.red('❌ Changelog is wrong'));
        throw new Error(`Unable to read changelog: ${err.message}`);
    }
}