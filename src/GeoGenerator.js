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

    generateGeoJson(road, parsed_meters, work) {

        const slice_list = [];

        const geoLine = this._getRoad(road);

        if (geoLine !== undefined) {

            const road_linestring = turf.lineString(geoLine, {
                name: road,
                work: work
            });

            const options = {units: 'meters'};

            for (const parsedMeter of parsed_meters) {
                try {
                    const along_from = turf.along(road_linestring, parsedMeter[0], options);
                    along_from.properties.name = 'Начало';
                    along_from.properties.data = work;
                    const along_to = turf.along(road_linestring, parsedMeter[1], options);
                    along_to.properties.name = 'Начало';
                    along_to.properties.data = work;

                    const slice = turf.lineSlice(along_from, along_to, road_linestring);

                    slice_list.push(along_from, along_to, slice);
                } catch (err) {
                    console.error(parsed_meters);
                }
            }
        }

        return slice_list;
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