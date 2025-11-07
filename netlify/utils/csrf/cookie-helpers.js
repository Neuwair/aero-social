import { DEFAULT_COOKIE_NAME } from "./constants.js";

export function createCsrfCookieHeader(token, opts = {}) {
  const {
    name = DEFAULT_COOKIE_NAME,
    maxAge = 60 * 60 * 24 * 7,
    secure = process.env.NODE_ENV === "production",
    httpOnly = false,
    sameSite = "Lax",
    path = "/",
  } = opts;

  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(token)}`];
  if (Number.isFinite(maxAge)) parts.push(`Max-Age=${Math.floor(maxAge)}`);
  if (path) parts.push(`Path=${path}`);
  if (secure) parts.push("Secure");
  if (httpOnly) parts.push("HttpOnly");
  if (sameSite) parts.push(`SameSite=${sameSite}`);

  return parts.join("; ");
}

export function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx < 0) continue;
    const name = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    try {
      out[decodeURIComponent(name)] = decodeURIComponent(val);
    } catch (error) {
      out[name] = val;
    }
  }
  return out;
}
