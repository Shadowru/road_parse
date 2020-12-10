const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const fse = require('fs-extra')

/*
 * Requires the MongoDB Node.js Driver
 * https://mongodb.github.io/node-mongodb-native
 */

const filter = {
    'parsed_addr.road': {
        '$nin': [
            null
        ]
    }
};

const filter2 = {
};


MongoClient.connect(
    'mongodb://localhost:50001/?readPreference=primary&appname=MongoDB%20Compass&ssl=false',
    { useNewUrlParser: true, useUnifiedTopology: true },
    function(connectErr, client) {
        assert.equal(null, connectErr);
        const coll = client.db('road-test').collection('repair_contract_parsed');
        coll.find(filter2, (cmdErr, result) => {
            assert.equal(null, cmdErr);

            result.toArray(function (err, docs) {
                assert.equal(err, null);
                //console.log("Found the following records");
                //console.log(docs);
                fse.writeJsonSync('../export.json', docs, {spaces: 4});
                client.close();
            });


        });
    });