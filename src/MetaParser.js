import Logger from "js-logger";
import fs_extra from "fs-extra";

export default class MetaParser {

    constructor() {
        Logger.useDefaults();

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
            dict: dict_raw
        };
    }

    parse(line) {

        let region_data = this._cutRegion(line);

        let places_data = this._cutPlace(region_data.line);

        //mutated_line = this._cutPlace(mutated_line);
        Logger.debug('Regions: ' + region_data.regions);
        Logger.debug('Places: ' + places_data.places);
        Logger.debug('Line: ' + places_data.line);

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

            Logger.debug(pos_cut);

            for (const cutElement of pos_cut) {

                const start_cut = cutElement.start - delta;
                const end_cut = cutElement.end - delta;

                Logger.debug(cutElement.start + "/" + cutElement.end + " | " + start_cut + "/" + end_cut);

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

    _cutRegion(line) {
        const pos_cut = this._findByType(line, ['субъект РФ']);

        const data = this._cutLine(line, pos_cut);

        return {
            regions: data.cut,
            line: data.line
        };
    }

    _cutPlace(line) {
        const pos_cut = this._findByType(line, ['село', 'деревня', 'город', 'сельское поселение', 'городское поселение']);

        const data = this._cutLine(line, pos_cut);

        return {
            places: data.cut,
            line: data.line
        };
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
                        if (this._isSafeToInsert(pos_line, pos_spc)) {
                            pos_line.push(pos_spc);
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
        const start_idx = line.indexOf(token, pos);
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
}
