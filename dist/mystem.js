"use strict";

var _mystem = require("mystem3");

var _mystem2 = _interopRequireDefault(_mystem);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const myStem = new _mystem2.default();
myStem.start();
myStem.lemmatize("Майминского").then(function (lemma) {
  console.log(lemma);
}).then(function () {
  myStem.stop();
}).catch(console.error);
//# sourceMappingURL=mystem.js.map