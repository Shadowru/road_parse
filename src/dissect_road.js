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

function getTitle(roadContract) {
    return roadContract.contract.products[0].name;
}

function getURL(roadContract) {
    return roadContract.contract.contractUrl;
}

function getCustomer(roadContract) {
    return roadContract.contract.customer.fullName;
}

function getSupplier(roadContract) {
    return roadContract.contract.suppliers[0].organizationName;
}

function getYear(contract) {
    const protocolDate = getDate(contract);

    if (protocolDate === undefined) {
        return "-";
    }
    return Number.parseInt(protocolDate.substring(0, 4));
}

function getDate(contract) {
    const real_contract = contract.contract;
    const protocolDate = real_contract.protocolDate;
    return protocolDate;
}

const year_start = 2014;
const year_stop = 2021;

const filters = [
    {
        filter: ['строит', 'капитальн'],
        name: 'build'
    },
    {
        filter: ['содержание'],
        name: 'maintenance'
    },
    {
        filter: ['ремонт'],
        name: 'repair'
    }
]

const contracts_classified = new Map();


function isInFilter(contract, filter) {
    const title = getTitle(contract).toLowerCase();

    for (const filterElement of filter) {
        if (title.indexOf(filterElement) !== -1) {
            return true;
        }
    }

    return false;
}

for (const roadName of contract_map.keys()) {

    const contract_list = contract_map.get(roadName);

    let start_array = [...contract_list];

    const classified_contracts = {
        all: contract_list
    };

    let leftover_array = [];

    for (const filter of filters) {

        let filter_array = [];
        leftover_array = [];

        for (const contract of start_array) {
            if (isInFilter(contract, filter.filter)) {
                filter_array.push(contract);
            } else {
                leftover_array.push(contract);
            }
        }

        start_array = leftover_array;

        classified_contracts[filter.name] = filter_array;

    }

    classified_contracts.other = leftover_array;

    contracts_classified.set(roadName, classified_contracts);

}
const filter_list = ['all', 'build', 'maintenance', 'repair', 'other'];

for (const filter of filter_list) {

    for (let year_from = year_start; year_from < year_stop; year_from++) {
        for (let year_to = year_from; year_to < year_stop; year_to++) {

            const roads = jsonToMap(fs_extra.readJsonSync('./data/road_dissected.json'));

            const readypart = [];


            let let_max_count = 0;

            function removeNonUniq(contract) {

                const contract_set = new Set();

                contract_set.add(contract);

                return Array.from(contract_set)[0];

            }

            function getPrice(roadContract) {
                return roadContract.contract.price;
            }

            for (const roadElement of contracts_classified) {

                const roadName = roadElement[0];

                console.info(roadName);

                const road_dissected = roads.get(roadName);

                if (road_dissected === undefined) {
                    console.log("NO GEO!");
                    continue;
                }

                const road_km_parts = road_dissected.features;

                const roadContracts = roadElement[1][filter];

                for (const roadContract of roadContracts) {

                    const contract_year = getYear(roadContract);

                    if (contract_year < year_from || contract_year > year_to) {
                        continue;
                    }

                    const numbers = roadContract.number_pairs;

                    for (const number of numbers) {

                        const line_start = number[0];
                        const line_end = number[1];

                        const line_start_km = line_start;
                        const line_end_km = line_end;

                        for (let road_km = line_start_km; road_km <= line_end_km; road_km++) {
                            const roadFeature = road_km_parts[road_km];
                            if (roadFeature !== undefined) {
                                let contract_array = roadFeature.properties.contract;

                                if (contract_array === undefined) {
                                    contract_array = [];
                                    roadFeature.properties.contract = contract_array;
                                }

                                contract_array.push({
                                    title: getTitle(roadContract),
                                    url: getURL(roadContract),
                                    year: getYear(roadContract),
                                    date: getDate(roadContract),
                                    price: getPrice(roadContract),
                                    customer: getCustomer(roadContract),
                                    supplier: getSupplier(roadContract),
                                    id: roadContract.contract._id
                                });

                                roadFeature.properties.road_title = roadName;

                                road_km_parts[road_km] = roadFeature;
                            }
                        }

                    }
                }
                //break;

                let cnt_sz = 0;

                for (const roadKmPart of road_km_parts) {
                    const contract = roadKmPart.properties.contract;
                    if (contract !== undefined) {

                        const cleanContract = removeNonUniq(contract);

                        roadKmPart.properties.contract = cleanContract;

                        const contract_sz = cleanContract.length;
                        if (contract_sz > 0) {
                            cnt_sz++;
                            if (contract_sz > let_max_count) {
                                let_max_count = contract_sz;
                            }
                            roadKmPart.properties.contract_count = contract_sz;
                            readypart.push(roadKmPart);
                        }
                        if (cnt_sz > 500) {
                            // break;
                        }
                    }
                }

            }

            const glued_parts = [];
// glueup

            let curr_element = undefined;

            function getContractCount(element) {
                return element.properties.contract_count;
            }

            function isSameContract(curr_element, next_element) {
                const curr_contracts = curr_element.properties.contract;
                const next_contracts = next_element.properties.contract;

                for (const currContract of curr_contracts) {
                    let has_match = false;
                    for (const nextContract of next_contracts) {
                        if (currContract.id === nextContract.id) {
                            has_match = true;
                        }
                    }
                    if (!has_match) {
                        return false;
                    }
                }

                return true;
            }

            function isSameSections(curr_element, next_element) {
                if (curr_element === undefined) {
                    return false;
                }
                if (next_element === undefined) {
                    return false;
                }
                if (getContractCount(curr_element) !== getContractCount(next_element)) {
                    return false;
                }
                if (isSameContract(curr_element, next_element)) {
                    return true;
                }
                return false;
            }

            function mergeGeo(curr_element, nextElement) {

                const merged_geometry = turf.lineString(
                    curr_element.geometry.coordinates.concat(
                        nextElement.geometry.coordinates)
                );

                curr_element.geometry.coordinates = merged_geometry.geometry.coordinates;
                curr_element.properties.section_end = nextElement.properties.km;
                return curr_element;
            }

            for (const nextElement of readypart) {

                if (isSameSections(curr_element, nextElement)) {
                    curr_element = mergeGeo(curr_element, nextElement);
                } else {
                    if (curr_element !== undefined) {
                        glued_parts.push(curr_element);
                    }
                    curr_element = nextElement;
                    curr_element.properties.section_start = curr_element.properties.km;
                    curr_element.properties.section_end = curr_element.properties.km;
                }
            }

            const red_dest = Math.floor(let_max_count * 2 / 3);
            const yellow_dest = Math.floor(let_max_count * 1 / 3);

            let length = 0;

            for (const readypartElement of glued_parts) {
                const contract_sz = readypartElement.properties.contract.length;
                let road_color = '#5beb33';

                if (contract_sz > red_dest) {
                    road_color = '#eb4233'
                } else if (contract_sz > yellow_dest) {
                    road_color = '#ebc333'
                }

                readypartElement.properties.color = road_color;

                let full_price = 0;

                for (const contractElement of readypartElement.properties.contract) {
                    full_price = full_price + contractElement.price;
                }

                length = length + (readypartElement.properties.section_end - readypartElement.properties.section_start) + 1;

                readypartElement.properties.full_price = full_price;
            }

            console.log('length : ' + length);
            console.log('glued_parts : ' + glued_parts.length);
            console.log('avg glued_parts : ' + length / glued_parts.length);

            const featureCollection = turf.featureCollection(glued_parts);

            fs_extra.writeJsonSync('./data/dissected/' + filter + '_' + year_from + '_' + year_to + '.json', featureCollection, {spaces: 4})

        }
    }
}

console.log('Done.');
