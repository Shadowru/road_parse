const fs = require('fs');
const readline = require('readline');
import Logger from "js-logger";

import MetaParser from "./MetaParser";

Logger.useDefaults();

const metaparser = new MetaParser();

async function processLineByLine() {
    const fileStream = fs.createReadStream('../data/input.txt');

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.

    for await (const line of rl) {
        Logger.debug('Line : ' + line);
        const parsed_addr = metaparser.parse(line);
    }
}

processLineByLine();
