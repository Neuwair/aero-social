function _isSecureContext() {
  try {
    if (typeof window === "undefined") return false;
    const host = window.location.hostname || "";
    const isLocal = /^(localhost|127\.|0\.0\.0\.0)/.test(host);
    return window.location.protocol === "https:" && !isLocal;
  } catch (e) {
    return false;
  }
}

function getSessionFromCookie() {
  const cookies =
    typeof document !== "undefined" && document.cookie
      ? document.cookie.split(";")
      : [];
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "session") {
      return decodeURIComponent(value);
    }
  }
  return null;
}

function getCsrfFromCookie() {
  const cookies =
    typeof document !== "undefined" && document.cookie
      ? document.cookie.split(";")
      : [];
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "csrf_token") {
      return decodeURIComponent(value);
    }
  }
  return null;
}

function _setCookie(name, value, opts = {}) {
  try {
    const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
    if (opts.maxAge) parts.push(`Max-Age=${Number(opts.maxAge)}`);
    if (opts.expires) parts.push(`Expires=${opts.expires}`);
    if (opts.path) parts.push(`Path=${opts.path}`);
    if (opts.domain) parts.push(`Domain=${opts.domain}`);
    const sameSite = opts.sameSite || "Strict";
    if (sameSite) parts.push(`SameSite=${sameSite}`);
    const secure = opts.secure !== undefined ? opts.secure : _isSecureContext();
    if (secure) parts.push(`Secure`);
    if (typeof document !== "undefined") document.cookie = parts.join("; ");
  } catch (e) {
    throw e;
  }
}

function _expireCookie(name, opts = {}) {
  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  try {
    const paths = opts.paths || [opts.path || "/"];
    const hostParts = (
      typeof window !== "undefined" ? window.location.hostname || "" : ""
    )
      .split(".")
      .filter(Boolean);
    paths.forEach((path) => {
      const base = `${encodeURIComponent(
        name
      )}=; Expires=${expires}; Path=${path}; SameSite=Strict`;
      const secure = _isSecureContext() ? "; Secure" : "";
      if (typeof document !== "undefined") document.cookie = base + secure;
    });

    for (let i = 0; i < hostParts.length; i++) {
      const domain = hostParts.slice(i).join(".");
      paths.forEach((path) => {
        const base = `${encodeURIComponent(
          name
        )}=; Expires=${expires}; Path=${path}; Domain=${domain}`;
        const secure = _isSecureContext() ? "; Secure" : "";
        if (typeof document !== "undefined") document.cookie = base + secure;
      });
    }
  } catch (e) {
    throw e;
  }
}

function setSessionCookie(sessionId, maxAge = 7 * 24 * 60 * 60) {
  try {
    _setCookie("session", sessionId, {
      maxAge,
      path: "/",
      sameSite: "Strict",
    });
  } catch (e) {
    const date = new Date();
    date.setTime(date.getTime() + maxAge * 1000);
    if (typeof document !== "undefined") {
      document.cookie = `session=${encodeURIComponent(
        sessionId
      )}; expires=${date.toUTCString()}; path=/; SameSite=Strict`;
    }
  }
}

function removeSessionCookie() {
  try {
    _expireCookie("session", { path: "/" });
  } catch (e) {
    if (typeof document !== "undefined") {
      document.cookie =
        "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict";
    }
  }
}

function removeCsrfCookie() {
  try {
    _expireCookie("csrf_token", { path: "/" });
  } catch (e) {
    if (typeof document !== "undefined") {
      document.cookie =
        "csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict";
    }
  }
}

export {
  getSessionFromCookie,
  setSessionCookie,
  removeSessionCookie,
  removeCsrfCookie,
  getCsrfFromCookie,
  _setCookie,
  _expireCookie,
};
