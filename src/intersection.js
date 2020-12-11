import * as turf from "@turf/turf";
import fs_extra from "fs-extra";

import GeoGenerator from './GeoGenerator';

const geo_generator = new GeoGenerator();

import IntersectionGenerator from './IntersectionGenerator';

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

const roadCollection = [];

for (const roadElement of contract_map) {

    const roadName = roadElement[0];

    console.info(roadName);

    const intersectionGenerator = new IntersectionGenerator(roadElement[1]);

    const geoLine = geo_generator._getRoad(roadName);

    if (geoLine === undefined) {
        console.error('NO GEO!');
        continue;
    }

    const road_linestring = turf.lineString(geoLine, {name: roadName});

    const intersections = intersectionGenerator.generate();


    for (const intersection of intersections) {

        const sliceLine = geo_generator._getSliceLine(
            road_linestring,
            intersection.start,
            intersection.end
        );

        //sliceLine.properties.contract = intersection.contract;

        roadCollection.push(
            sliceLine
        )

    }
}

const featureCollection = turf.featureCollection(roadCollection);

fs_extra.writeJsonSync('./data/repair_2.json', featureCollection, {spaces: 4})



