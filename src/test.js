const parse = require('csv-parse')
const fs = require('fs')
const transform = require('stream-transform')

const parser = parse({
    delimiter: ';',
    quote: '"',
    ltrim: true,
    rtrim: true
})

const transformer = transform((record, callback) => {
    callback(null, record.join(' ') + '\n')
}, {
    parallel: 5
});

fs.createReadStream('./data/export.csv').pipe(parser).pipe(transformer).pipe(process.stdout)