"use strict";

var _turf = require("@turf/turf");

var turf = _interopRequireWildcard(_turf);

var _MetersParser = require("./MetersParser");

var _MetersParser2 = _interopRequireDefault(_MetersParser);

var _GeoGenerator = require("./GeoGenerator");

var _GeoGenerator2 = _interopRequireDefault(_GeoGenerator);

var _fsExtra = require("fs-extra");

var _fsExtra2 = _interopRequireDefault(_fsExtra);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const csv = require('csv-parser');

const fs = require('fs');

const metersParser = new _MetersParser2.default();
const geoGenerator = new _GeoGenerator2.default();

Array.prototype.pushArray = function (arr) {
  this.push.apply(this, arr);
};

const collection = [];
fs.createReadStream('./data/export.csv').pipe(csv({
  'separator': ';'
})).on('data', data => {
  //console.log(data);
  const road = data.Road;
  const meters = data.Meters;
  const work = data.Line;

  if (road !== undefined) {
    if (meters !== undefined) {
      const parsed_meters = metersParser.parse(meters);

      if (parsed_meters !== undefined && parsed_meters.length !== 0) {
        const slice_list = geoGenerator.generateGeoJson(road.trim().toLowerCase(), parsed_meters, work);

        if (slice_list !== undefined && slice_list.length > 0) {
          collection.pushArray(slice_list);
        }
      }
    }
  }
}).on('end', () => {
  const featureCollection = turf.featureCollection(collection);

  _fsExtra2.default.writeJsonSync('./data/repair.json', featureCollection, {
    spaces: 4
  });
});
//# sourceMappingURL=road_generate.js.map