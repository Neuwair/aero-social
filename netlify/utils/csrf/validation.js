import {
  DEFAULT_COOKIE_NAME,
  DEFAULT_HEADER_NAME,
  ENV_CSRF_SECRET,
} from "./constants.js";
import { getTokenFromRequest } from "./request-tokens.js";
import { verifySignedToken } from "./signed-tokens.js";

export function verifyDoubleSubmit(reqOrEvent, options = {}) {
  const {
    cookieName = DEFAULT_COOKIE_NAME,
    headerName = DEFAULT_HEADER_NAME,
    bodyField = "_csrf",
  } = options;

  const tokens = getTokenFromRequest(reqOrEvent, {
    cookieName,
    headerName,
    bodyField,
  });

  if (!tokens.cookieToken) {
    return { valid: false, reason: "missing_cookie" };
  }

  if (!tokens.providedToken) {
    return { valid: false, reason: "missing_provided_token" };
  }

  if (
    typeof tokens.cookieToken !== "string" ||
    typeof tokens.providedToken !== "string"
  ) {
    return { valid: false, reason: "invalid_token_type" };
  }

  if (ENV_CSRF_SECRET && tokens.cookieToken.includes(".")) {
    const verification = verifySignedToken(tokens.cookieToken, ENV_CSRF_SECRET);
    if (!verification.valid) {
      return { valid: false, reason: verification.reason };
    }
  }

  const valid = tokens.cookieToken === tokens.providedToken;
  return { valid, reason: valid ? null : "token_mismatch" };
}
