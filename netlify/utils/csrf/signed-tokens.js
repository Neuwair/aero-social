import crypto from "crypto";
import { ENV_CSRF_SECRET } from "./constants.js";

function base64urlEncode(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(value) {
  let input = value.replace(/-/g, "+").replace(/_/g, "/");
  while (input.length % 4) input += "=";
  return Buffer.from(input, "base64").toString();
}

export function createSignedToken(secret, payload = {}, expiresSeconds = 3600) {
  if (!secret) throw new Error("createSignedToken requires a secret");
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + (Number(expiresSeconds) || 0),
  };
  const bodyJson = JSON.stringify(body);
  const bodyB64 = base64urlEncode(bodyJson);
  const sig = crypto.createHmac("sha256", secret).update(bodyB64).digest();
  const sigB64 = base64urlEncode(sig);
  return `${bodyB64}.${sigB64}`;
}

export function verifySignedToken(token, secret) {
  if (!secret) throw new Error("verifySignedToken requires a secret");
  if (!token || typeof token !== "string") {
    return { valid: false, reason: "invalid_token" };
  }
  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, reason: "bad_format" };
  }
  const [bodyB64, sigB64] = parts;
  let bodyJson;
  try {
    bodyJson = base64urlDecode(bodyB64);
  } catch (error) {
    return { valid: false, reason: "bad_body" };
  }
  let body;
  try {
    body = JSON.parse(bodyJson);
  } catch (error) {
    return { valid: false, reason: "bad_json" };
  }

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(bodyB64)
    .digest();
  const sigBuf = Buffer.from(
    sigB64.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  );
  if (expectedSig.length !== sigBuf.length) {
    return { valid: false, reason: "bad_signature" };
  }
  const validSig = crypto.timingSafeEqual(expectedSig, sigBuf);
  if (!validSig) {
    return { valid: false, reason: "bad_signature" };
  }

  const now = Math.floor(Date.now() / 1000);
  if (body.exp && now > body.exp) {
    return { valid: false, reason: "expired" };
  }

  return { valid: true, payload: body };
}

export function signWithEnv(payload = {}, expiresSeconds = 3600) {
  if (!ENV_CSRF_SECRET) {
    throw new Error("CSRF_SECRET not configured in environment");
  }
  return createSignedToken(ENV_CSRF_SECRET, payload, expiresSeconds);
}

export function verifyWithEnv(token) {
  if (!ENV_CSRF_SECRET) {
    throw new Error("CSRF_SECRET not configured in environment");
  }
  return verifySignedToken(token, ENV_CSRF_SECRET);
}
