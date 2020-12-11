import * as turf from "@turf/turf";

const csv = require('csv-parser')
const fs = require('fs')

import MetersParser from './MetersParser'
import GeoGenerator from './GeoGenerator'
import fs_extra from "fs-extra";

const metersParser = new MetersParser();
const geoGenerator = new GeoGenerator();

Array.prototype.pushArray = function (arr) {
    this.push.apply(this, arr);
};

const collection = [];

fs.createReadStream('./data/export.csv')
    .pipe(csv({
        'separator': ';'
    }))
    .on('data', (data) => {

        //console.log(data);

        const road = data.Road;
        const meters = data.Meters;
        const work = data.Line;

        if (road !== undefined) {
            if (meters !== undefined) {

                const parsed_meters = metersParser.parse(meters);

                if (parsed_meters !== undefined && parsed_meters.length !== 0) {

                    const slice_list = geoGenerator.generateGeoJson(
                        road.trim().toLowerCase(),
                        parsed_meters,
                        work
                    );

                    if (slice_list !== undefined && slice_list.length > 0) {
                        collection.pushArray(slice_list);
                    }

                }

            }
        }

    })
    .on('end', () => {

        const featureCollection = turf.featureCollection(collection);

        fs_extra.writeJsonSync('./data/repair.json', featureCollection, {spaces: 4})

    });
