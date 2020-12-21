import fs_extra from "fs-extra";
import GeoGenerator from "./GeoGenerator";
import * as turf from "@turf/turf";

export default class GeoJSONGenerator {

    constructor() {
        String.prototype.replaceAll = function (search, replace) {
            return this.split(search).join(replace);
        };

        this._intersections = fs_extra.readJsonSync('./data/export.json');
        this._geo_generator = new GeoGenerator();
        this._contract_map = this._readContract(this._intersections);
    }

    _jsonToMap(jsonStr) {
        return new Map(JSON.parse(jsonStr));
    }

    _readRoads(){
        return this._jsonToMap(fs_extra.readJsonSync('./data/road_dissected.json'));
    };

    _convert_to_pairs(numbers) {
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

    _readContract(intersections) {
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
                        const pairs = this._convert_to_pairs(numbers);

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
        return contract_map;
    }

    _getTitle(roadContract) {
        return roadContract.contract.products[0].name;
    }

    _getURL(roadContract) {
        return roadContract.contract.contractUrl;
    }

    _getYear(contract) {
        const real_contract = contract.contract;
        const protocolDate = real_contract.protocolDate;

        if (protocolDate === undefined) {
            return "-";
        }
        return Number.parseInt(protocolDate.substring(0, 4));
    }

    _removeNonUniq(contract) {

        const contract_set = new Set();

        contract_set.add(contract);

        return Array.from(contract_set)[0];

    }

    _getPrice(roadContract) {
        return roadContract.contract.price;
    }

    _getContractCount(element) {
        return element.properties.contract_count;
    }

    _isSameContract(curr_element, next_element) {
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

    _isSameSections(curr_element, next_element) {
        if (curr_element === undefined) {
            return false;
        }
        if (next_element === undefined) {
            return false;
        }
        if (this._getContractCount(curr_element) !== this._getContractCount(next_element)) {
            return false;
        }
        if (this._isSameContract(curr_element, next_element)) {
            return true;
        }
        return false;
    }

    _mergeGeo(curr_element, nextElement) {

        const merged_geometry = turf.lineString(
            curr_element.geometry.coordinates.concat(
                nextElement.geometry.coordinates)
        );

        curr_element.geometry.coordinates = merged_geometry.geometry.coordinates;
        curr_element.properties.section_end = nextElement.properties.km;
        return curr_element;
    }

    getGeoJSON() {

        const readypart = [];

        const roads = this._jsonToMap(fs_extra.readJsonSync('./data/road_dissected.json'));

        let let_max_count = 0;

        for (const roadElement of this._contract_map) {

            const roadName = roadElement[0];

            console.info(roadName);

            const road_dissected = roads.get(roadName);

            if (road_dissected === undefined) {
                console.log("NO GEO!");
                continue;
            }

            const road_km_parts = road_dissected.features;

            const roadContracts = roadElement[1];

            for (const roadContract of roadContracts) {

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
                                title: this._getTitle(roadContract),
                                url: this._getURL(roadContract),
                                year: this._getYear(roadContract),
                                price: this._getPrice(roadContract),
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

                    const cleanContract = this._removeNonUniq(contract);

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
                }
            }

        }

        const glued_parts = [];
        let curr_element = undefined;

        for (const nextElement of readypart) {

            if (this._isSameSections(curr_element, nextElement)) {
                curr_element = this._mergeGeo(curr_element, nextElement);
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

        return featureCollection;
    }

}
