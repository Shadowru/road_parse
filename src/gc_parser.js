const parse = require('csv-parse')
const fs = require('fs')
const transform = require('stream-transform')

const parser = parse({
    delimiter: ',',
    quote: '"',
    ltrim: true,
    rtrim: true
})

const DAFT2 = 'Total time for which application threads were stopped: ';
const DAFT = '[Parallel Time: ';

let trigger = false;

const transformer = transform((record, callback) => {

    const rr = record[1];
    const idx = rr.indexOf(DAFT);

    let time = undefined;

    if (idx !== -1) {
        const spc_substr_idx = rr.indexOf(' ', idx + DAFT.length);

        const time_str = rr.substring(
            idx + DAFT.length,
            spc_substr_idx
        );

        time = Number.parseFloat(
            time_str
        )
    }

    let ret_val = '';

    if (!isNaN(time)) {

        if (time > 400) {
            ret_val = rr + '\r\n';
        }
    }
    callback(null, ret_val);
}, {
    parallel: 1
});

fs.createReadStream('C:\\8\\!_CPS_GC_LOGS_amaterasu505.csv')
    .pipe(parser)
    .pipe(transformer)
    .pipe(fs.createWriteStream('../gc.log'));
