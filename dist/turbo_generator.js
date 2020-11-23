"use strict";

var _mongodb = require("mongodb");

var _assert = require("assert");

var _assert2 = _interopRequireDefault(_assert);

var _MetaParser = require("./MetaParser2");

var _MetaParser2 = _interopRequireDefault(_MetaParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const url = 'mongodb://localhost:27017';
const url_remote = 'mongodb://localhost:50001';
const mongo_url = url; // Database Name

const dbName = 'road-test';
const metaparser = new _MetaParser2.default();
let insert_collection = undefined;
let cnt = 0;

async function proceed_parse(doc, collection = insert_collection) {
  const title = doc.nomn_title.replace();
  const parsed_addr = metaparser.parse(title);
  doc.parsed_addr = parsed_addr;
  await collection.insertOne(doc); //if (cnt % 100 === 0) {

  console.log(cnt++); //}
}

const client = new _mongodb.MongoClient(mongo_url);

async function run_parse() {
  // Use connect method to connect to the server
  try {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    const repair_contract_collection = db.collection("repair_contract_processed");
    insert_collection = db.collection("repair_contract_parsed"); //await insert_collection.drop();

    const cursor = repair_contract_collection.find();
    await cursor.forEach(proceed_parse);
  } finally {
    await client.close();
  }
}

run_parse().catch(console.dir);
//# sourceMappingURL=turbo_generator.js.map