"use strict";

var _az = require("az");

var _az2 = _interopRequireDefault(_az);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_az2.default.Morph.init('../node_modules/az/dicts', () => {
  const tokens = _az2.default.Tokens('Установка элементов обустройства автомобильных дорог общего  пользования федерального значения. Установка дорожных знаков на участке км 10+600 – км 293+410 автомобильной дороги М-5 «Урал» Москва – Рязань – Пенза – Самара – Уфа – Челябинск (Оренбург – Орск – Подъезд к пункту пропуска «Орск»), Оренбургская область.').done();

  let nominative_string = '';

  for (const token of tokens) {
    const word = token.toString();

    if (word !== undefined && word.length > 1) {
      const parses = _az2.default.Morph(word);

      if (parses !== undefined) {
        if (parses.length > 0) {
          const parser = parses[0];
          const tag = parses[0].tag;
          const nominative = parser.inflect(tag, 'nomn');
          nominative_string = nominative_string + " " + nominative.toString();
        }
      } else {
        nominative_string = nominative_string + " " + word;
      }
    } else {
      nominative_string = nominative_string + word;
    }
  }

  console.log(nominative_string);
});
//# sourceMappingURL=az.js.map