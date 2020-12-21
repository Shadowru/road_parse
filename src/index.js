import serveStatic from "serve-static";
import express from "express";

import GeoJSONGenerator from './GeoJSONGenerator';

const geoJSONGenerator = new GeoJSONGenerator();

const app = express();
const port = 3000;

app.disable('etag');

app.use(serveStatic('pages', {'index': ['viewer2.html']}));

app.get('/data', (req, res) => {
    res.contentType('application/json; charset=utf-8');
    res.send(geoJSONGenerator.getGeoJSON());
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
