import MyStem from "mystem3";

const myStem = new MyStem();
myStem.start();

myStem.lemmatize("Майминского").then(function (lemma) {
    console.log(lemma);
}).then(function () {
    myStem.stop();
}).catch(console.error);
