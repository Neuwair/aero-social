import crypto from "crypto";

export function generateUID() {
  return crypto.randomBytes(16).toString("hex");
}

export function generateSessionId() {
  return crypto.randomBytes(32).toString("hex");
}

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}
