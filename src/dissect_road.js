import * as turf from "@turf/turf";
import fs_extra from "fs-extra";

import GeoGenerator from './GeoGenerator';

String.prototype.replaceAll = function (search, replace) {
    return this.split(search).join(replace);
};


const intersections = fs_extra.readJsonSync('./data/export.json');

function convert_to_pairs(numbers) {
    const dd = [];
    let pair = [];
    for (const number of numbers) {

        const rr = parseFloat(number.replaceAll('+', '.').replaceAll('-', ''));

        pair.push(rr);

        if (pair.length === 2) {
            if (pair[0] < pair[1])
                dd.push(pair);
            else {
                console.log('Reverse order');
            }
            pair = []
        }
    }

    return dd;
}

const contract_map = new Map();

for (const intersection of intersections) {

    const addr = intersection.parsed_addr;

    const road = addr.road.trim().toLowerCase()
        .replaceAll('–', '-')
        .replaceAll('«', '"')
        .replaceAll('»', '"');
    const numbers = addr.numbers;

    if (road !== null) {

        if (numbers != null) {

            if (numbers.length === 1) {

            } else {
                const pairs = convert_to_pairs(numbers);

                let road_list = contract_map.get(road);

                if (road_list === undefined) {
                    road_list = [];
                }

                road_list.push({
                    contract: intersection.contract,
                    number_pairs: pairs
                })

                contract_map.set(road, road_list);

            }

        }

    }

}

function jsonToMap(jsonStr) {
    return new Map(JSON.parse(jsonStr));
}

const roads = jsonToMap(fs_extra.readJsonSync('./data/road_dissected.json'));

function toKM(pos) {
    return Math.floor(pos / 1000);
}


const readypart = [];

function getTitle(roadContract) {
    return roadContract.contract.products[0].name;
}

function getURL(roadContract) {
    return roadContract.contract.contractUrl;
}

function getYear(protocolDate) {
    if (protocolDate === undefined) {
        return "-";
    }
    return Number.parseInt(protocolDate.substring(0, 4));
}

let let_max_count = 0;


for (const roadElement of contract_map) {

    const roadName = roadElement[0];

    console.info(roadName);

    const road_dissected = roads.get(roadName);

    if (road_dissected === undefined) {
        console.log("NO GEO!");
        continue;
    }

    const roadContracts = roadElement[1];

    for (const roadContract of roadContracts) {

        const road_km_parts = road_dissected.features;

        const numbers = roadContract.number_pairs;

        for (const number of numbers) {

            const line_start = number[0];
            const line_end = number[1];

            const line_start_km = line_start;
            const line_end_km = line_end;

            for (let road_km = line_start_km; road_km <= line_end_km; road_km++) {
                const roadFeature = road_km_parts[road_km];
                if (roadFeature !== undefined) {
                    let contract_array = roadFeature.contract;

                    if (contract_array === undefined) {
                        contract_array = [];
                        roadFeature.contract = contract_array;
                    }

                    contract_array.push({
                        title: getTitle(roadContract),
                        url: getURL(roadContract),
                        year: getYear(roadContract.protocolDate)
                    });
                    road_km_parts[road_km] = roadFeature;
                }
            }

        }

        let cnt_sz = 0;

        for (const roadKmPart of road_km_parts) {
            if (roadKmPart.contract !== undefined) {
                const contract_sz = roadKmPart.contract.length;
                if (contract_sz > 1) {
                    cnt_sz++;
                    if (contract_sz > let_max_count) {
                        let_max_count = contract_sz;
                    }
                    roadKmPart.contract_count = contract_sz;
                    readypart.push(roadKmPart);
                }
                if (cnt_sz > 500) {
                    break;
                }
            }
        }

    }
    //break;
}


const red_dest = Math.floor(let_max_count * 2 / 3);
const yellow_dest = Math.floor(let_max_count * 1 / 3);

for (const readypartElement of readypart) {
    const contract_sz = readypartElement.contract.length;
    let road_color = '#5beb33';

    if (contract_sz > red_dest) {
        road_color = '#eb4233'
    } else if (contract_sz > yellow_dest) {
        road_color = '#ebc333'
    }
    readypartElement.properties.color = road_color;
}

const featureCollection = turf.featureCollection(readypart);

fs_extra.writeJsonSync('./data/parsed_dissected.json', featureCollection, {spaces: 4})


