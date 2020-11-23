import {MongoClient} from "mongodb";
import assert from "assert";
import MetaParser2 from "./MetaParser2";

const url = 'mongodb://localhost:27017';
const url_remote = 'mongodb://localhost:50001';

const mongo_url = url_remote;

// Database Name
const dbName = 'road-test';

const metaparser = new MetaParser2();

let insert_collection = undefined

async function proceed_parse(doc, collection = insert_collection) {
    const title = doc.nomn_title;

    const parsed_addr = metaparser.parse(title);

    doc.parsed_addr = parsed_addr;

    await collection.insertOne(doc);

}

const client = new MongoClient(mongo_url);

async function run_parse() {
// Use connect method to connect to the server
    try {
        await client.connect();

        console.log("Connected successfully to server");

        const db = client.db(dbName);
        const repair_contract_collection = db.collection("repair_contract_processed");
        insert_collection = db.collection("repair_contract_parsed");

        const cursor = repair_contract_collection.find();

        await cursor.forEach(proceed_parse);
    } finally {
        client.close()
    }
}

run_parse().catch(console.dir);