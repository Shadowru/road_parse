import {MongoClient} from "mongodb";

const url = 'mongodb://localhost:27017';
const url_remote = 'mongodb://localhost:50001';

const mongo_url = url_remote;

// Database Name
const dbName = 'road-test';

const road_collection = [];

let cnt = 0;

String.prototype.replaceAll = function (search, replace) {
    return this.split(search).join(replace);
}


async function proceed_load_roads(doc) {
    road_collection.push(
        doc
    )
}

async function proceed_parse(doc, collection = road_collection) {

    const title = doc.nomn_title.replaceAll(" ", '').replaceAll('«', '').replaceAll('»', '').replaceAll('—', '-').replaceAll(' ', ' ').trim().toLowerCase();

    for (const roadCollectionElement of road_collection) {
        const road_name = roadCollectionElement.name.toLowerCase();
        if(title.indexOf(road_name) !== -1){
            console.log(road_name);
            console.log(title);
            break;
        }
    }

    //console.log(title);

}

const client = new MongoClient(mongo_url);

async function run_parse() {
// Use connect method to connect to the server
    try {
        await client.connect();

        console.log("Connected successfully to server");

        const db = client.db(dbName);
        const repair_contract_collection = db.collection("repair_contract_processed");

        const region_roads_collection = db.collection("region_roads");
        const roads_cursor = region_roads_collection.find();

        await roads_cursor.forEach(proceed_load_roads);

        const cursor = repair_contract_collection.find({region: "51"});

        await cursor.forEach(proceed_parse);
    } finally {
        await client.close()
    }
}

run_parse().catch(console.dir);
