#! /usr/bin/env node
const program = require('commander');
const { parser, Release } = require('keep-a-changelog');
const fs = require('fs');
const Semver = require('semver/classes/semver');
const SimpleVersion = require('./internal/SimpleVersion');

program
  .version('1.1.0')
  .parse(process.argv);

program
  .command('release <releaseVersion>')
  .description('Make a release from unreleased bloc')
  .option('-u, --unreleased', 'Add a unreleased bloc')
  .option('-f, --file [filePath]', 'Changelog file to parse and update (default is CHANGELOG.md in the current directory)')
  .option('-S, --no-semver', 'Do not use semantic version but a simplier version manager (allowing more than 3 digit-version)')
  .parse(process.argv)
  .action(function (releaseVersion, options) {makeRelease(releaseVersion, options);});

program
  .command('merge <releaseVersion>')
  .description('Merge all snapshot blocs (and optionnaly the unreleased bloc) under a new release bloc')
  .option('-u, --unreleased', 'Also take the unreleased bloc')
  .option('-f, --file [filePath]', 'Changelog file to parse and update (default is CHANGELOG.md in the current directory)')
  .option('-S, --no-semver', 'Do not use semantic version but a simplier version manager (allowing more than 3 digit-version)')
  .parse(process.argv)
  .action(function (releaseVersion, options) {mergeRelease(releaseVersion, options);});

//for incorrect commands
program.on('command:*', function () {
    program.help();
});
if (process.argv.length === 2) {
    program.help();
}
program.parse(process.argv);

var filePath;
var changelog;
var simpleVersionning;

function makeRelease(releaseVersion, options) {
    init(options);
    const release = changelog.findRelease();

    if(release && !release.isEmpty()) {
        release.setVersion(getAsObject(releaseVersion));
        release.setDate(new Date());
        if(options.unreleased) {
            changelog.addRelease(createRelease());
        }

        rewrite();
    } else {
        console.error("No unreleased bloc.")
    }
}

function mergeRelease(releaseVersion, options) {
    init(options);

    var mergedRelease = createRelease(releaseVersion, new Date());
    var currentUnreleased;
    var first = true;
    while(changelog.releases.length > 0) {
        const release = changelog.releases.shift();
        if(!options.unreleased && !release.version) {
            currentUnreleased = release;
        } else if(!release.version || release.version.toString().indexOf("-SNAPSHOT") >= 0) {
            addToRelease(release, mergedRelease);
        } else {
            first? addToRelease(release, mergedRelease) : changelog.releases.unshift(release);
            break;
        }
        first = false;
    }

    if(currentUnreleased) {
        changelog.addRelease(currentUnreleased);
    }
    if(mergedRelease.isEmpty()) {
        console.log("No merge has been done");
    } else {
        changelog.addRelease(mergedRelease);
    }

    rewrite();
}

function init(options) {
    filePath = 'CHANGELOG.md';
    if(options.file) {
        filePath = options.file;
    }
    simpleVersionning = !options.semver;
    changelog = parser(fs.readFileSync(filePath, 'UTF-8'), { releaseCreator: createRelease });
}

function addToRelease(releaseToAdd, mergedRelease) {
    releaseToAdd.changes.forEach((changes , type) => {
        changes.forEach((change) => {
            mergedRelease.addChange(type, change);
        });
    });
}

function getAsObject(versionStr) {
    if(!versionStr) {
        return;
    }
    return simpleVersionning ? new SimpleVersion(versionStr.toUpperCase()) : new Semver(versionStr.toUpperCase());
}

function createRelease(versionStr, date, description) {
    return new Release(getAsObject(versionStr), date, description);
}

function rewrite() {
    fs.writeFileSync(filePath, changelog.toString(), 'UTF-8');
}
