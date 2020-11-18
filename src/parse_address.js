const fs = require('fs');
const readline = require('readline');
import Logger from "js-logger";

import MetaParser from "./MetaParser";
import MetaParser2 from "./MetaParser2";

Logger.useDefaults();

const metaparser = new MetaParser2();

function getMeta(addr) {
    let count = 0;
    if (addr.state !== undefined) {
        count++;
    }
    if (addr.region !== undefined) {
        count++;
    }
    if (addr.road !== undefined) {
        count++;
    }
    if (addr.numbers !== undefined) {
        count++;
    }
    if (addr.geo !== undefined) {
        count++;
    }
    return 'PH' + count;
}

function printCSVLine(addr) {
    const meta = getMeta(addr);
    console.log(
        meta + ";"
        + addr.state + ";"
        + addr.region + ";"
        + addr.road + ";"
        + addr.geo + ";"
        + addr.numbers + ";"
        + addr.residue
    );
}

async function processLineByLine(file) {
    const fileStream = fs.createReadStream(file);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.

    console.log('Meta;State;Region;Road;Geo;Meters;Residue;');

    for await (const line of rl) {
        //Logger.debug('===========================');
        //Logger.debug('Data line : ' + line);
        const parsed_addr = metaparser.parse(line);

        printCSVLine(parsed_addr);
    }
}

//processLineByLine('../data/test.txt');
processLineByLine('./data/nomn.txt');
//processLineByLine('../data/input.txt');
