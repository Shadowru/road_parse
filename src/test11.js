const fs = require('fs');
const readline = require('readline');
import Logger from "js-logger";

Logger.useDefaults();

function cutServer(to_socket) {
    //marica49.ca.sbrf.
    return to_socket.substr(0, to_socket.indexOf('.:'));
}

async function processLineByLine(file) {
    const fileStream = fs.createReadStream(file);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const map = new Map();

    for await (const line of rl) {
        const fracture = line.split(/(\s+)/);
        if (fracture.length > 6) {
            const from_socket = fracture[6];
            const to_socket = fracture[8];
            //TcpCommunicationSpi: 47100~
            //TcpDiscoverySpi：47500~47600
            if (from_socket.indexOf(':47100') !== -1) {

                const key = cutServer(to_socket);
                let rr = map.get(key);

                if (rr !== undefined) {
                    map.set(key, rr + 1);
                } else {
                    map.set(key, 1);
                }

            }
        }
    }

    for (const mapElement of map) {
        console.log(mapElement);
    }

}

processLineByLine('../data/4.txt');
