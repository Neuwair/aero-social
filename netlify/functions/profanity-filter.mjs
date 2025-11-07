import jaroWinkler from "jaro-winkler";
const FUZZY_THRESHOLD = 0.9;
import profaneWordsList from "profane-words";
import naughtyEn from "naughty-words/en.json" with { type: "json" };
import naughtyEs from "naughty-words/es.json" with { type: "json" };
import naughtyDe from "naughty-words/de.json" with { type: "json" };
import naughtyAr from "naughty-words/ar.json" with { type: "json" };
import naughtyZh from "naughty-words/zh.json" with { type: "json" };
import naughtyCs from "naughty-words/cs.json" with { type: "json" };
import naughtyDa from "naughty-words/da.json" with { type: "json" };
import naughtyNl from "naughty-words/nl.json" with { type: "json" };
import naughtyEo from "naughty-words/eo.json" with { type: "json" };
import naughtyFil from "naughty-words/fil.json" with { type: "json" };
import naughtyFi from "naughty-words/fi.json" with { type: "json" };
import naughtyFr from "naughty-words/fr.json" with { type: "json" };
import naughtyFrCa from "naughty-words/fr-CA-u-sd-caqc.json" with { type: "json" };
import naughtyHi from "naughty-words/hi.json" with { type: "json" };
import naughtyHu from "naughty-words/hu.json" with { type: "json" };
import naughtyIt from "naughty-words/it.json" with { type: "json" };
import naughtyJa from "naughty-words/ja.json" with { type: "json" };
import naughtyKab from "naughty-words/kab.json" with { type: "json" };
import naughtyTlh from "naughty-words/tlh.json" with { type: "json" };
import naughtyKo from "naughty-words/ko.json" with { type: "json" };
import naughtyNo from "naughty-words/no.json" with { type: "json" };
import naughtyFa from "naughty-words/fa.json" with { type: "json" };
import naughtyPl from "naughty-words/pl.json" with { type: "json" };
import naughtyPt from "naughty-words/pt.json" with { type: "json" };
import naughtyRu from "naughty-words/ru.json" with { type: "json" };
import naughtySv from "naughty-words/sv.json" with { type: "json" };
import naughtyTh from "naughty-words/th.json" with { type: "json" };
import naughtyTr from "naughty-words/tr.json" with { type: "json" };

function combinedBannedWords() {
  return new Set([
    ...profaneWordsList,
    ...naughtyEn,
    ...naughtyEs,
    ...naughtyDe,
    ...naughtyAr,
    ...naughtyZh,
    ...naughtyCs,
    ...naughtyDa,
    ...naughtyNl,
    ...naughtyEo,
    ...naughtyFil,
    ...naughtyFi,
    ...naughtyFr,
    ...naughtyFrCa,
    ...naughtyHi,
    ...naughtyHu,
    ...naughtyIt,
    ...naughtyJa,
    ...naughtyKab,
    ...naughtyTlh,
    ...naughtyKo,
    ...naughtyNo,
    ...naughtyFa,
    ...naughtyPl,
    ...naughtyPt,
    ...naughtyRu,
    ...naughtySv,
    ...naughtyTh,
    ...naughtyTr,
  ]);
}
var combinedBannedWords = combinedBannedWords();

function allowList() {
  return new Set([
    "assassin",
    "buttress",
    "cumbersome",
    "scunthorpe",
    "classic",
    "assignment",
    "assimilate",
    "asset",
    "harassment",
    "grass",
    "bass",
    "pass",
    "class",
    "massive",
    "brass",
    "compass",
    "passive",
    "glass",
    "assault",
    "cassette",
    "chassis",
    "compassion",
    "embarrass",
    "cocktail",
    "cockatoo",
    "peacock",
    "cockle",
    "hitchcock",
    "shuttlecock",
    "cockpit",
    "weathercock",
    "cocky",
    "hello",
    "shell",
    "dwell",
    "bestseller",
    "hellish",
    "hellhound",
    "pumpernickel",
    "hellraiser",
    "hellfire",
    "cumbersome",
    "accumulate",
    "incumbent",
    "vacuum",
    "circumstance",
    "document",
    "locus",
    "circumference",
    "titrate",
    "entitled",
    "little",
    "titter",
    "statistics",
    "attitude",
    "subtle",
    "subtlety",
    "pre-title",
    "constitute",
    "institution",
    "partition",
    "restitution",
    "pussycat",
    "percussion",
    "Richard",
    "dickinson",
    "dickens",
    "moby-dick",
    "verdict",
    "edict",
    "firetruck",
    "truck",
    "trucker",
    "chick-lit",
    "buttress",
    "penis",
    "vagina",
    "pussy",
    "clitoris",
    "scrotum",
    "titties",
    "erection",
    "pubic",
    "penicillin",
    "Tijuana",
    "Dick",
    "Gaylord",
    "Cox",
    "Penistone",
    "Shitagi",
    "Fukushima",
    "Fukui",
    "Sooke",
    "Mianus",
    "Fucking",
    "Pussyfoot",
  ]);
}
var allowList = allowList();

function subtitutions() {
  return {
    "@": "a",
    4: "a",
    3: "e",
    1: "i",
    "!": "i",
    "|": "i",
    0: "o",
    "()": "o",
    5: "s",
    $: "s",
    "+": "t",
    7: "t",
    8: "b",
    9: "g",
    6: "g",
    "(": "c",
    ")": "c",
    "[": "l",
    "]": "l",
  };
}

const substitutions = subtitutions();

/**
 * @param {string} text
 * @returns {string}
 */
function tokenizeAndNormalizeText(text) {
  let normalizedText = text.toLowerCase();
  for (const [char, sub] of Object.entries(substitutions)) {
    const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedChar, "g");
    normalizedText = normalizedText.replace(regex, sub);
  }
  normalizedText = removeRepetitiveChars(normalizedText);
  return normalizedText.replace(/[^a-z0-9\s]/g, " ").trim();
}

/**
 * @param {string} text
 * @returns {string}
 */
function removeRepetitiveChars(text) {
  return text.replace(/(.)\1+/g, "$1");
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function containsProfanity(text) {
  const normalizedText = tokenizeAndNormalizeText(text);
  const wordsInText = normalizedText
    .split(" ")
    .filter((word) => word.length > 2);
  const bannedWordsArray = [...combinedBannedWords];

  if (
    allowList.has(normalizedText) ||
    wordsInText.some((word) => allowList.has(word))
  ) {
    return false;
  }

  for (const bannedWord of bannedWordsArray) {
    if (normalizedText.includes(bannedWord)) {
      return true;
    }
  }

  const compressedText = normalizedText.replace(/ /g, "");
  for (const bannedWord of bannedWordsArray) {
    if (compressedText.includes(bannedWord)) {
      return true;
    }
  }

  for (const userWord of wordsInText) {
    for (const bannedWord of bannedWordsArray) {
      if (
        userWord.length >= bannedWord.length - 2 &&
        userWord.length <= bannedWord.length + 2
      ) {
        const similarity = jaroWinkler(userWord, bannedWord);
        if (similarity >= FUZZY_THRESHOLD) {
          return true;
        }
      }
    }
  }

  return false;
}

export { containsProfanity };