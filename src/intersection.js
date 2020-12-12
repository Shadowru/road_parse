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

const filters = [
    {value: '', name: 'all'},
    {value: 'ремонт', name: 'repair'},
    {value: 'содержание', name: 'soder'},
    {value: 'строительство', name: 'build'}
];

function getTitle(roadContract) {
    return roadContract.products[0].name.toLowerCase();
}


function getYear(protocolDate) {
    if(protocolDate === undefined){
        return 0;
    }
    return Number.parseInt(protocolDate.substring(0, 4));
}

function filterRoad(value, year, roadContracts) {

    const retval = [];

    for (const roadContract of roadContracts) {

        const realContract = roadContract.contract;

        if (value.length > 0) {
            if (getTitle(realContract).indexOf(value) < 0) {
                continue;
            }
        }

        if (getYear(realContract.protocolDate) < year) {
            continue;
        }

        retval.push(roadContract);
    }

    return retval;
}

let year = 2017;

do {
    for (const filter of filters) {

        for (const roadElement of contract_map) {

            const roadName = roadElement[0];

            console.info(roadName);

            const filteredRoads = filterRoad(filter.value, year, roadElement[1]);

            const intersectionGenerator = new IntersectionGenerator(filteredRoads);

            const geoLine = geo_generator._getRoad(roadName);

            if (geoLine === undefined) {
                console.error('NO GEO! Count : ' + roadElement[0].length);
                continue;
            }

            const road_linestring = turf.lineString(geoLine, {name: roadName});

            const intersections = intersectionGenerator.generate();

            for (const intersection of intersections) {

                let sliceLine22 = geo_generator._getSliceLine(
                    road_linestring,
                    intersection.start * 1000,
                    intersection.end * 1000
                );

                const sliceLine = JSON.parse(JSON.stringify(sliceLine22));

                sliceLine.properties.contracts = intersection.contract;

                let road_color = '#5beb33';
                let opacity = 0.2;

                if (intersection.contract.length > 10) {
                    road_color = '#eb4233'
                    opacity = 0.9
                } else if (intersection.contract.length > 5) {
                    road_color = '#ebc333'
                    opacity = 0.4
                }

                sliceLine.properties.color = road_color;
                sliceLine.properties.opacity = opacity;
                sliceLine.properties.contract_count = intersection.contract.length;

                roadCollection.push(
                    sliceLine
                )

            }

            //console.log(roadCollection);
        }

        const featureCollection = turf.featureCollection(roadCollection);

        fs_extra.writeJsonSync('./data/repair_' + filter.name + '_' + year + '.json', featureCollection, {spaces: 4})

    }
    year++;
} while (year !== 2020);

