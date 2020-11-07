// require csvtojson
var csv = require("csvtojson");

const csvFilePath = '../dict/data-20200122T1200-structure-20200122T1200.csv'

// Convert a csv file with csvtojson
csv()
    .fromFile(csvFilePath)
         .on("csv",function(row) { // an array of csv cols like [col1, col2, col3 ...]
             console.log(row);
         });
    // .on("end_parsed",function(jsonArrayObj){ //when parse finished, result will be emitted here.
    //     console.log(jsonArrayObj);
    // })

// // Parse large csv with stream / pipe (low mem consumption)
// csv()
//     .fromStream(readableStream)
//     .on("json",function(jsonObj){ //single json object will be emitted for each csv line
//         console.log(jsonObj);
//     })
//
// //Convert csv string to csv rows
// csv()
//     .fromString(csvString)
//     .on("csv",function(row){ // an array of csv cols like [col1, col2, col3 ...]
//         console.log(row);
//     })
