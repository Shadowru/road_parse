import * as turf from "@turf/turf";

import {MongoClient} from "mongodb";
import fs_extra from "fs-extra";

const url = 'mongodb://localhost:27017';
const url_remote = 'mongodb://localhost:50001';

const mongo_url = url_remote;

// Database Name
const dbName = 'road-test';


const murmansk_highway = fs_extra.readJsonSync('./data/murmansk/highway-line.geojson');

const road_list = murmansk_highway.features;

String.prototype.replaceAll = function (search, replace) {
    return this.split(search).join(replace);
}

Object.defineProperty(String.prototype, 'hashCode', {
    value: function () {
        var hash = 0, i, chr;
        for (i = 0; i < this.length; i++) {
            chr = this.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }
});

const murmansk_roads = new Map();

for (const road of road_list) {
    let road_name = road.properties.NAME;

    if (road_name === undefined || road_name === null) {
        road_name = road.properties.REF;
    }


    if (road_name !== undefined && road_name !== null) {
        const hashCode = road_name;//.hashCode();

        const road_object = murmansk_roads.get(hashCode);

        if (road_object === undefined) {
            murmansk_roads.set(hashCode, [road]);
        } else {

            road_object.push(road);
        }

    }
}

const insert_collection = [];

for (const murmanskRoad of murmansk_roads) {

    const road_name = murmanskRoad[0].replaceAll('«', '').replaceAll('»', '').replaceAll(' ', ' ').replaceAll('—', '-').trim();

    if (road_name.length < 3) {
        continue;
    }

    const lineBuffer = [];

    const roads_array = murmanskRoad[1];

    for (const roadsArrayElement of roads_array) {
        lineBuffer.push(
            roadsArrayElement.geometry.coordinates
        );
    }

    const multiLineRoad = turf.multiLineString([lineBuffer]);

    insert_collection.push(
        {
            name: road_name,
            region: 51,
            geo: multiLineRoad
        }
    );
}

const client = new MongoClient(mongo_url);

async function run_parse() {
    try {
        await client.connect();

        console.log("Connected successfully to server");

        const db = client.db(dbName);
        const region_roads_collection = db.collection("region_roads");

        region_roads_collection.drop();

        await region_roads_collection.insertMany(
            insert_collection
        );

    } finally {
        await client.close()
    }
}

run_parse().catch(console.dir);
