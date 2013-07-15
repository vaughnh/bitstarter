#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return fs.readFileSync(htmlfile);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var logJson = function(out) {
    console.log(JSON.stringify(out, null, 4));
};

var checkHtml = function(htmlstring, checksfile) {
    $ = cheerio.load(htmlstring);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }

    logJson(out);
    //return out;
};

var checkHtmlUrl = function(url, checksfile) {
    rest.get(url).on('complete', function(result) {
        if(result instanceof Error) {
            console.error("Error retreiving url %s", url);
            this.retry(5000); // try again in 5 seconds
        } else {
            checkHtml(result, checksfile);
        }
    });
};

var checkHtmlFile = function(htmlfile, checksfile) {
    return checkHtml(cheerioHtmlFile(htmlfile), checksfile);
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json')
        .option('-f, --file <html_file>', 'Path to index.html')
        .option('-u, --url <url>', 'URL to index.html')
        .parse(process.argv);

    if(program.url) {
        console.log("it is a url");
        checkHtmlUrl(program.url, program.checks);
    } else if (program.file) {
        checkHtmlFile(program.file, program.checks);   
    }
    //var checkJson = checkHtmlFile(program.file, program.checks);
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
