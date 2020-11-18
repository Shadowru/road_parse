"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _jsLogger = require("js-logger");

var _jsLogger2 = _interopRequireDefault(_jsLogger);

var _fsExtra = require("fs-extra");

var _fsExtra2 = _interopRequireDefault(_fsExtra);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

String.prototype.replaceAll = function (search, replace) {
  return this.split(search).join(replace);
};

String.prototype.tokenize = function () {
  return this.split(' ');
};

class MetaParser2 {
  constructor() {
    this._initDict();
  }

  parse(line) {
    const data1 = this._phase1(line);

    const data3 = this._phase3(data1.line);

    const data2 = this._phase2(data3.line);

    const data4 = this._phase4(data2.line);

    const data5 = this._phase5(data4.line);

    const residue_line = data5.line; // Logger.info('State : ' + data1.value);
    // Logger.info('Region : ' + data2.value);
    // Logger.info('Road : ' + data3.value);
    // Logger.info('Meters : ' + data4.value);

    return {
      state: data1.value,
      region: data2.value,
      road: data3.value,
      numbers: data4.value,
      geo: data5.value,
      residue: residue_line
    };
  }

  _initDict() {
    const region_dict = _fsExtra2.default.readJsonSync('../data/dict.json');

    const roads_dict = _fsExtra2.default.readJsonSync('../data/roads.json');

    this._dict = {
      region: region_dict,
      roads: roads_dict
    };
  }

  _phase1(line) {
    const region_pos = this._findByType(line, ['субъект РФ']);

    if (region_pos !== undefined) {
      return {
        line: this._cut(line, region_pos.start, region_pos.end),
        value: line.substring(region_pos.start, region_pos.end)
      };
    }

    return {
      line: line,
      value: undefined
    };
  }

  _phase2(line) {
    let mutated_line = line;
    const value = [];

    while (true) {
      const region_pos = this._findByType(mutated_line, ['район', 'улус (р-н)']);

      if (region_pos !== undefined) {
        value.push(mutated_line.substring(region_pos.start, region_pos.end));
        mutated_line = this._cut(mutated_line, region_pos.start, region_pos.end);
      } else {
        break;
      }
    }

    return {
      line: mutated_line,
      value: value.length > 0 ? value : undefined
    };
  }

  _phase3(line) {
    const clean_line = line.replaceAll("«", "\"").replaceAll("»", "\"").replaceAll("–", "-");

    const road_pos = this._findRoad(clean_line);

    if (road_pos !== undefined) {
      return {
        line: this._cut(line, road_pos.start, road_pos.end),
        value: line.substring(road_pos.start, road_pos.end)
      };
    }

    return {
      line: line,
      value: undefined
    };
  }

  _phase4(line) {
    let mutated_line = line;
    const value = [];

    while (true) {
      const tokens = mutated_line.tokenize();

      for (const token of tokens) {
        const remove_ss = token.replace("+", "").replace(",", "").replace("км", "").replace("км.", "");
        const number = parseInt(remove_ss);

        if (!isNaN(number)) {
          value.push(token);
          const idx = mutated_line.indexOf(token);
          mutated_line = this._cut(mutated_line, idx, idx + token.length);
          continue;
        }
      }

      break;
    }

    return {
      line: mutated_line,
      value: value.length > 0 ? value : undefined
    };
  }

  _phase5(line) {
    let mutated_line = line;
    const value = [];

    while (true) {
      const geo_pos = this._findByType2(mutated_line, ['село', 'деревня', 'город', 'город обл. знач.', 'город обл. подч.', 'сельское поселение', 'городское поселение']);

      if (geo_pos !== undefined) {
        value.push(mutated_line.substring(geo_pos.start, geo_pos.end));
        mutated_line = this._cut(mutated_line, geo_pos.start, geo_pos.end);
        continue;
      }

      break;
    }

    return {
      line: mutated_line,
      value: value.length > 0 ? value : undefined
    };
  }

  _findRoad(line) {
    for (const road of this._dict.roads) {
      const long_token = road.title_name + " " + road.name;

      const tmp_pos = this._findPosInLine(line, long_token);

      if (tmp_pos !== undefined) {
        return tmp_pos;
      }

      const short_token = road.title_name + " " + road.name;

      const tmp_pos_short = this._findPosInLine(line, short_token);

      if (tmp_pos_short !== undefined) {
        return tmp_pos_short;
      }

      const name_token = road.name;

      const tmp_name_short = this._findPosInLine(line, name_token);

      if (tmp_name_short !== undefined) {
        return tmp_name_short;
      }
    }

    return undefined;
  }

  _findPosInLine(line, token) {
    const token_idx = line.toLowerCase().indexOf(token.toLowerCase());

    if (token_idx !== -1) {
      const token_size = token.length;
      return {
        start: token_idx,
        length: token_size,
        end: token_idx + token_size
      };
    }

    return undefined;
  }

  _findByType(line, type_list) {
    for (const dict_element of this._dict.region) {
      if (this._isInList(dict_element.type, type_list)) {
        const token = dict_element.name;

        const tmp_pos = this._findPosInLine(line, token);

        if (tmp_pos !== undefined) {
          return tmp_pos;
        }
      }
    }

    return undefined;
  } //TODO: callback


  _findByType2(line, type_list) {
    const test_line = line.replaceAll("\"", " ");

    for (const dict_element of this._dict.region) {
      if (this._isInList(dict_element.type, type_list)) {
        const token = dict_element.name + " ";

        if (token.length > 5) {
          const tmp_pos = this._findPosInLine(test_line, token);

          if (tmp_pos !== undefined) {
            tmp_pos.end = tmp_pos.end - 1;
            return tmp_pos;
          }
        }
      }
    }

    return undefined;
  }

  _isInList(value, values_list) {
    return values_list.includes(value);
  }

  _cut(str, cutStart, cutEnd) {
    return str.substr(0, cutStart) + str.substr(cutEnd + 1);
  }

}

exports.default = MetaParser2;
//# sourceMappingURL=MetaParser2.js.map