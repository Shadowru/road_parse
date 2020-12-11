import fs_extra from "fs-extra";
import * as turf from '@turf/turf';

const repair = fs_extra.readJsonSync('./data/repair.json');

Array.prototype.pushArray = function (arr) {
    this.push.apply(this, arr);
};


function getOverlap(startFeature, endFeature) {
    const overlapFeature = turf.lineOverlap(
        startFeature,
        endFeature
    );

    return overlapFeature;
}

let features = repair.features;

let overlap_feature = [];

let processed = 0;

do {

    processed = 0;

    for (let i = 0; i < features.length; i++) {

        for (let j = 0; j < features.length; j++) {

            if (i === j) {
                continue;
            }

            const startFeature = features[i];
            const endFeature = features[j];

            const overlap = getOverlap(startFeature, endFeature);

            if (overlap !== undefined && overlap.features !== undefined && overlap.features.length > 0) {

                overlap_feature.pushArray(
                    overlap.features
                );

                processed++;

            }

        }

    }

    features = overlap_feature;
    overlap_feature = [];

    console.log('Processed : ' + processed);

} while (processed > 0)

const featureCollection = turf.featureCollection(features);
fs_extra.writeJsonSync('./data/repair_overlap.json', featureCollection, {spaces: 4})
