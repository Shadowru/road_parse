import fs_extra from "fs-extra";
import * as turf from '@turf/turf';

export default class GeoGenerator {


    constructor() {
        this._initDict();
    }

    _initDict() {
        const road_dict = fs_extra.readJsonSync(
            './data/geo_roads.json'
        );
        this._road_dict = road_dict;
    }

    _generateLineProp(data) {

        const contract = data.contract;
        const contractor = contract.suppliers[0];

        const line_prop = {
            "name": data.parsed_addr.road,
            "title": data.title,
            "date": contract.protocolDate,
            "link": contract.contractUrl,
            "contractor": contractor.organizationName + 'КПП : ' + contractor.kpp
        }

        return line_prop;
    }

    generateGeoJson(road, parsed_meters, data) {

        const line_prop = this._generateLineProp(data);

        const slice_list = [];

        const geoLine = this._getRoad(road);

        if (geoLine !== undefined) {

            const road_linestring = turf.lineString(geoLine, line_prop);

            for (const parsedMeter of parsed_meters) {
                try {
                    this._getSliceLine(road_linestring, parsedMeter[0], parsedMeter[1])
                    slice_list.push(slice);
                } catch (err) {
                    console.error(parsed_meters);
                }
            }
        }

        return slice_list;
    }

    _getSliceLine(road_linestring, start, end) {
        const options = {units: 'meters'};

        const along_from = turf.along(road_linestring, start, options);
        const along_to = turf.along(road_linestring, end, options);

        const slice = turf.lineSlice(along_from, along_to, road_linestring);

        return slice;
    }

    decodePolyline(str, precision) {
        var index = 0,
            lat = 0,
            lng = 0,
            coordinates = [],
            shift = 0,
            result = 0,
            byte = null,
            latitude_change,
            longitude_change,
            factor = Math.pow(10, precision || 6);

        while (index < str.length) {
            byte = null;
            shift = 0;
            result = 0;

            do {
                byte = str.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);

            latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

            shift = result = 0;

            do {
                byte = str.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);

            longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

            lat += latitude_change;
            lng += longitude_change;

            coordinates.push([lat / factor, lng / factor]);
        }

        return coordinates;
    }

    _getRoad(road) {
        const geoLine = this._road_dict[road];
        if (geoLine !== undefined) {
            const route = this.decodePolyline(geoLine, 6);
            for (const routeElement of route) {
                const el1 = routeElement[0];
                routeElement[0] = routeElement[1];
                routeElement[1] = el1;
            }
            return route;
        }
        return undefined;
    }

}
