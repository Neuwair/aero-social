import { adjectives, nouns } from "./constants.js";

export function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateRandomUsername() {
  const base = `${randomFromArray(adjectives)}${randomFromArray(nouns)}`;
  const suffix = Math.floor(Math.random() * 9000) + 100;
  return `${base}${suffix}`;
}
