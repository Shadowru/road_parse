import fs from 'fs';

import {MongoClient} from "mongodb";

const url = 'mongodb://localhost:27017';
const url_remote = 'mongodb://localhost:50001';

const mongo_url = url_remote;

// Database Name
const dbName = 'road-test';

const write_steam = fs.createWriteStream('../export.json');

async function proceed_parse(doc) {

    write_steam.write(JSON.stringify(doc));
    write_steam.write(',\r\n');

}

const client = new MongoClient(mongo_url);

async function run_parse() {
// Use connect method to connect to the server
    try {
        await client.connect();

        console.log("Connected successfully to server");

        const db = client.db(dbName);
        const repair_contract_collection = db.collection("repair_contract_parsed");
        const cursor = repair_contract_collection.find();

        write_steam.write('[' +
            '\r\n');
        await cursor.forEach(proceed_parse);
        write_steam.end(']');
    } finally {
        await client.close();
    }
}

run_parse().catch(console.dir);
