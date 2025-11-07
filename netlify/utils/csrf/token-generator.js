import crypto from "crypto";

export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}
