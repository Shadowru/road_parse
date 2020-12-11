export default class MetersParser {

    parse(meters) {

        const meter_data = [];
        let meter_pair = [];

        for (const meterElement of meters) {

            if (typeof meterElement === 'string' || myVar instanceof String) {

                if (meterElement.trim().length === 0) {
                    continue;
                }

                const meter = meterElement.replace('+', '').replace('-', '');

                const parsed = parseInt(meter, 10);

                if (isNaN(parsed)) {
                    console.log(meter);

                    continue;
                }

                meter_pair.push(parsed);

                if (meter_pair.length > 1) {
                    meter_data.push(meter_pair);
                    meter_pair = [];
                }

            }
        }
        return meter_data;
    }

}
