
export default class IntersectionGenerator {

    constructor(road_element) {

        this._road_elements = road_element;

    }

    generate() {

        Array.prototype.pushArray = function (arr) {
            this.push.apply(this, arr);
        };


        const road_line = [];

        for (const road_element of this._road_elements) {

            const numbers = road_element.number_pairs;

            for (const number of numbers) {

                const line_start = number[0];
                const line_end = number[1];

                this._insert_to_array(
                    line_start,
                    line_end,
                    road_line,
                    road_element
                );

            }

        }
        return road_line;
    }

    _insert_to_array(start, end, array, data_element) {

        if (array.length === 0) {
            this._insertElement(
                array,
                this._createElement(start, end, [data_element])
            );
            return;
        }

        this._sortArray(array);

        let insert_index = 0;

        for (const arrayElement of array) {
            if (arrayElement.start > start) {
                break;
            }
            insert_index++;
        }

        this._insertElementAtPosition(
            insert_index,
            array,
            this._createElement(start, end, [data_element])
        );

        this._fixDelta(
            insert_index,
            array
        );
    }

    _fixDelta(insert_index, array) {

        let head_index = insert_index;

        while (true) {

            let headElement = array[head_index];

            let tail_index = head_index + 1;

            let tailElement = array[tail_index];

            if (tailElement === undefined) {
                break;
            }

            if (headElement.end <= tailElement.start) {
                break;
            }

            const intersect = this._createElement(
                tailElement.start,
                headElement.end,
                headElement.contract
            )

            intersect.contract.pushArray(tailElement.contract);

            array[insert_index].end = array[tail_index].start;
            array[tail_index].start = intersect.end;

            this._insertElementAtPosition(
                tail_index,
                array,
                intersect
            );

            head_index++;
        }
    }

    _insertElementAtPosition(index, array, element) {
        array.splice(
            index, 0,
            element
        );
    }

    _insertElement(array, data_element) {
        array.push(
            data_element
        )
    }

    _createElement(start, end, data_element) {
        return {
            start: start,
            end: end,
            contract: data_element
        };
    }

    _sortArray(array) {
        array.sort((a, b) => {
            return a.start - b.start
        });
    }
}
