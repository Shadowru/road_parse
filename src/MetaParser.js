import Logger from "js-logger";
import fs_extra from "fs-extra";

export default class MetaParser {

    constructor() {
        Logger.useDefaults();

        this._delta = 2;
        this._dict = this._loadDictionaries();
    }

    _loadDictionaries() {

        const dict_raw = fs_extra.readJsonSync(
            '../data/dict.json'
        );

        const reverse_dict = {};

        for (const dictElement of dict_raw) {
            reverse_dict[dictElement.name] = dictElement.type;
        }

        return {
            reverse_dict: reverse_dict,
            dict: dict_raw,
            type_dict: fs_extra.readJsonSync('../data/matcher.json')
        };
    }

    parse(line) {

        const region_data = this._cutRegion(line);
        Logger.debug('After region: ' + region_data.line);

        const roads_data = this._cutRoads(region_data.line);

        const division_data = this._cutDivision(region_data.line);

        Logger.debug('After division: ' + division_data.line);

        const places_data = this._cutPlace2(division_data.line);
        //const places_data2 = this._cutPlace(places_data.line);

        //mutated_line = this._cutPlace(mutated_line);
        Logger.debug('Regions: ' + region_data.regions);
        Logger.debug('Divisions: ' + division_data.divisions);
        Logger.debug('Places: ' + places_data.places);
        //Logger.debug('Places2: ' + places_data2.places);
        Logger.debug('Line: ' + places_data.line);
    }

    _cutRoads(line) {

    }

    _cutRegion(line) {
        const pos_cut = this._findByType(line, ['субъект РФ']);

        const data = this._cutLine(line, pos_cut);

        return {
            regions: data.cut,
            line: data.line
        };
    }

    _cutDivision(line) {
        const pos_cut = this._findByType(line, ['район', 'улус (р-н)']);

        if (pos_cut.length > 0) {
            const data = this._cutLine(line, [pos_cut[pos_cut.length - 1]]);

            return {
                divisions: data.cut,
                line: data.line
            };
        }

        return {
            divisions: "",
            line: line
        }
    }

    _cutPlace(line) {
        const pos_cut = this._findByType(line, ['село', 'деревня', 'город', 'сельское поселение', 'городское поселение']);

        const data = this._cutLine(line, pos_cut);

        return {
            places: data.cut,
            line: data.line
        };
    }

    _cutPlace2(line) {

        const places = [];

        const type_dict = this._dict.type_dict;

        let mutated_line = line;

        for (const type_element of type_dict) {

            let pos = 0;

            while (true) {

                const prefix = type_element.prefix;
                const type = type_element.type;

                const index_pos = mutated_line.indexOf(
                    prefix,
                    pos
                )

                if (index_pos !== -1) {

                    pos = index_pos;

                    const pos_cut = this._simpleFindByType(
                        mutated_line,
                        pos + prefix.length,
                        type,
                        this._delta
                    );

                    if (pos_cut !== undefined) {

                        pos_cut[0].start = index_pos;

                        const data = this._cutLine(line, pos_cut);

                        places.push(
                            pos_cut[0].type + ' ' + data.cut
                        )

                        mutated_line = data.line;

                        mutated_line = this.cut(mutated_line, pos, pos + prefix.length);

                    } else {
                        break;
                    }

                } else {
                    break;
                }
            }
        }

        return {
            places: places,
            line: mutated_line
        };

    }

    _simpleFindByType(line, pos, type, delta) {
        for (const dict_element of this._dict.dict) {
            if (this._isInList(dict_element.type, type)) {
                let start_pos = pos;

                const name = dict_element.name;

                const pos_spc = this._findInLine(
                    line,
                    start_pos,
                    name
                );

                if (pos_spc !== undefined) {
                    if (pos_spc.start - pos < delta + type.length) {
                        if (this._isEndOfWord(line, pos_spc.end)) {

                            pos_spc.type = dict_element.type;

                            return [pos_spc];
                        }
                    }
                }
            }
        }
        return undefined;
    }

    _findByType(line, type_list) {
        const pos_line = [];

        for (const dict_element of this._dict.dict) {
            if (this._isInList(dict_element.type, type_list)) {
                let start_pos = 0;

                const name = dict_element.name;

                while (start_pos < name.length) {

                    const pos_spc = this._findInLine(
                        line,
                        start_pos,
                        name
                    );

                    if (pos_spc === undefined) {
                        break;
                    } else {
                        if (this._isEndOfWord(line, pos_spc.end)) {
                            if (this._isSafeToInsert(pos_line, pos_spc)) {
                                pos_line.push(pos_spc);
                            }
                        }
                        start_pos = pos_spc.end;
                    }
                }
            }
        }

        return pos_line;
    }

    _findInLine(line, pos, token) {
        //TODO: morphing
        const start_idx = line.toLowerCase().indexOf(token.toLowerCase(), pos);
        if (start_idx === -1) {
            return undefined;
        }
        return {
            start: start_idx,
            end: start_idx + token.length
        }
    }

    _isInList(value, values_list) {
        return values_list.includes(value);
    }

    _isSafeToInsert(pos_line, pos_spc) {
        for (const posLineElement of pos_line) {
            if (pos_spc.start >= posLineElement.start && pos_spc.start <= posLineElement.end) {
                return false;
            }
        }
        return true;
    }

    cut(str, cutStart, cutEnd) {
        return str.substr(0, cutStart) + str.substr(cutEnd + 1);
    }

    _cutLine(line, pos_cut) {
        let mutated_line = line;
        const data = [];

        if (pos_cut.length !== 0) {
            //Logger.debug(pos_cut);
            let delta = 0;

            //Logger.debug(pos_cut);

            for (const cutElement of pos_cut) {

                const start_cut = cutElement.start - delta;
                const end_cut = cutElement.end - delta;

                //Logger.debug(cutElement.start + "/" + cutElement.end + " | " + start_cut + "/" + end_cut);

                const cut_element = mutated_line.substring(
                    start_cut,
                    end_cut
                );

                data.push(
                    cut_element
                );

                mutated_line = this.cut(
                    mutated_line,
                    start_cut,
                    end_cut
                );

                delta += end_cut - start_cut;
            }

        }

        return {
            cut: data,
            line: mutated_line
        }

    }

    _isEndOfWord(line, pos) {
        if (pos === line.length) {
            return true;
        }
        const char = line.charAt(pos);
        return [' ', '.', ':'].includes(char);
    }
}
