import * as turf from "@turf/turf";

import {MongoClient} from "mongodb";
import assert from "assert";
import MetersParser from './MetersParser'
import GeoGenerator from './GeoGenerator'
import fs_extra from "fs-extra";


const url = 'mongodb://localhost:27017';
const url_remote = 'mongodb://localhost:50001';

const mongo_url = url_remote;

// Database Name
const dbName = 'road-test';

const client = new MongoClient(mongo_url);

const metersParser = new MetersParser();
const geoGenerator = new GeoGenerator();

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

                    const slice_list = geoGenerator.generateGeoJson(
                        road.trim().toLowerCase(),
                        parsed_meters,
                        data
                    );

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

        const cursor = repair_contract_collection.find({ "parsed_addr.road": { $ne: undefined } });

        await cursor.forEach(proceed_generate);
    } finally {

        console.log('Done. Saving json');

        const featureCollection = turf.featureCollection(geo_collection);
        fs_extra.writeJsonSync('./data/repair.json', featureCollection, {spaces: 4})

        await client.close();

    }
}

run_parse().catch(console.dir);
