import * as turf from "@turf/turf";
import fs_extra from "fs-extra";

import GeoGenerator from './GeoGenerator';
import IntersectionGenerator from "./IntersectionGenerator";

const geo_generator = new GeoGenerator();

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


const road_map = new Map();

const options_meters = {units: 'meters'};

for (const roadElement of contract_map) {

    const roadName = roadElement[0];

    console.info(roadName);

    const geoLine = geo_generator._getRoad(roadName);

    if (geoLine === undefined) {
        console.error('NO GEO! Count : ' + roadElement[0].length);
        continue;
    }

    const road_linestring = turf.lineString(geoLine, {name: roadName});

    const length = turf.length(road_linestring, options_meters);

    let km_length = Math.floor(turf.length(road_linestring, options_meters) / 1000);

    //km_length = Math.min(km_length, 10);

    console.log('km_length : ' + km_length);

    const road_km = [];

    for (let km = 0; km < km_length; km++) {

        if (km % 100 === 0) {
            console.log('KM : ' + km);
        }

        // if (km > 1000) {
        //     continue;
        // }

        let sliceLine22 = geo_generator._getSliceLine(
            road_linestring,
            km * 1000,
            (km + 1) * 1000
        );

        const sliceLine = JSON.parse(JSON.stringify(sliceLine22));

        sliceLine.properties.km = km;

        let road_color = '#5beb33';

        if (km > Math.floor(km_length * 2 / 3)) {
            road_color = '#eb4233'
        } else if (km > Math.floor(km_length / 3)) {
            road_color = '#ebc333';
        }


        sliceLine.properties.color = road_color;

        road_km.push(sliceLine);
    }

    road_map.set(roadName, road_km);

}

const dissected_roads = new Map();

for (const roadMapElement of road_map) {


    const featureCollection = turf.featureCollection(roadMapElement[1]);

    dissected_roads.set(roadMapElement[0], featureCollection);

}

function mapToJson(map) {
    return JSON.stringify([...map]);
}

fs_extra.writeJsonSync('./data/road_dissected.json', mapToJson(dissected_roads), {spaces: 4})
