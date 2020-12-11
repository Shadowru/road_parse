"use strict";

var _turf = require("@turf/turf");

var turf = _interopRequireWildcard(_turf);

var _mongodb = require("mongodb");

var _assert = require("assert");

var _assert2 = _interopRequireDefault(_assert);

var _MetersParser = require("./MetersParser");

var _MetersParser2 = _interopRequireDefault(_MetersParser);

var _GeoGenerator = require("./GeoGenerator");

var _GeoGenerator2 = _interopRequireDefault(_GeoGenerator);

var _fsExtra = require("fs-extra");

var _fsExtra2 = _interopRequireDefault(_fsExtra);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const url = 'mongodb://localhost:27017';
const url_remote = 'mongodb://localhost:50001';
const mongo_url = url_remote; // Database Name

const dbName = 'road-test';
const client = new _mongodb.MongoClient(mongo_url);
const metersParser = new _MetersParser2.default();
const geoGenerator = new _GeoGenerator2.default();

Array.prototype.pushArray = function (arr) {
  this.push.apply(this, arr);
};

const geo_collection = [];
let count = 0;

async function proceed_generate(doc) {
  try {
    const data = doc.parsed_addr;
    const road = data.road;
    const meters = data.numbers;

    if (road !== null) {
      if (meters !== null) {
        const parsed_meters = metersParser.parse(meters);

        if (parsed_meters !== undefined && parsed_meters.length !== 0) {
          const slice_list = geoGenerator.generateGeoJson(road.trim().toLowerCase(), parsed_meters, data);

          if (slice_list !== undefined && slice_list.length > 0) {
            geo_collection.pushArray(slice_list);
          }
        }
      }
    }
  } catch (exc) {
    console.error(doc);
  }

  if (count % 100 === 0) {
    console.log('Count : ' + count);
  }

  count = count + 1;
}

async function run_parse() {
  // Use connect method to connect to the server
  try {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    const repair_contract_collection = db.collection("repair_contract_parsed");
    const cursor = repair_contract_collection.find({
      "parsed_addr.road": {
        $ne: undefined
      }
    });
    await cursor.forEach(proceed_generate);
  } finally {
    console.log('Done. Saving json');
    const featureCollection = turf.featureCollection(geo_collection);

    _fsExtra2.default.writeJsonSync('./data/repair.json', featureCollection, {
      spaces: 4
    });

    await client.close();
  }
}

run_parse().catch(console.dir);
//# sourceMappingURL=turbo_road.js.map