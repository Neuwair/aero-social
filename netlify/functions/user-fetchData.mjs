import {
  verifyDoubleSubmit,
  getTokenFromRequest,
} from "../utils/csrf/index.js";
import { authService } from "../utils/auth/index.js";

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(";").forEach((cookie) => {
    const [name, value] = cookie.trim().split("=");
    if (name && value) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(value);
    }
  });

  return cookies;
}

function getIp(event) {
  return (
    event.headers["x-forwarded-for"] || event.headers["client-ip"] || "unknown"
  );
}

function respond(statusCode, bodyObj) {
  return {
    statusCode,
    body: JSON.stringify(bodyObj),
  };
}

function warnSuspicious(message, meta = {}) {
  console.warn("SECURITY WARNING:", message, meta);
}

function checkHttpMethod(event) {
  if (event.httpMethod !== "POST") {
    return respond(405, { message: "Method not allowed" });
  }
  return null;
}

function checkCsrf(event) {
  const csrfVerification = verifyDoubleSubmit(event);
  if (!csrfVerification.valid) {
    try {
      const tokens = getTokenFromRequest(event);
      console.warn("user-fetchData CSRF validation failed", {
        reason: csrfVerification.reason,
        cookieToken: tokens.cookieToken
          ? `${tokens.cookieToken.slice(0, 8)}...`
          : null,
        providedToken: tokens.providedToken
          ? `${tokens.providedToken.slice(0, 8)}...`
          : null,
        hasHeaderToken: Boolean(tokens.headerToken),
        hasBodyToken: Boolean(tokens.bodyToken),
      });
    } catch (loggingError) {
      console.warn("user-fetchData CSRF logging failed", loggingError);
    }
    return respond(403, { message: "CSRF token invalid" });
  }
  return null;
}

function getSessionIdOrRespond(event) {
  const cookies = parseCookies(event.headers.cookie);
  const sessionId = cookies.session;

  if (!sessionId) {
    return respond(401, { message: "No session found" });
  }

  return sessionId;
}

async function verifySessionOrRespond(sessionId, event) {
  try {
    const sessionResult = await authService.verifySession(sessionId);
    if (!sessionResult.success) {
      return respond(401, { message: "Invalid or expired session" });
    }
    return sessionResult.user;
  } catch (error) {
    console.error("Session verification error:", error);
    warnSuspicious("Session verification failed", {
      sessionId: sessionId.substring(0, 8) + "...",
      ip: getIp(event),
      error: error.message,
    });
    return respond(401, { message: "Session verification failed" });
  }
}

function parseRequestBodyOrRespond(event) {
  try {
    return JSON.parse(event.body || "{}");
  } catch (error) {
    return respond(400, { message: "Invalid JSON" });
  }
}

function validateUidOrRespond(requestBody, event) {
  return null;
}

export const handler = async (event, context) => {
  const methodCheck = checkHttpMethod(event);
  if (methodCheck) return methodCheck;

  const csrfCheck = checkCsrf(event);
  if (csrfCheck) return csrfCheck;

  const sessionId = getSessionIdOrRespond(event);
  if (typeof sessionId !== "string") return sessionId;

  const user = await verifySessionOrRespond(sessionId, event);
  if (user && typeof user.statusCode === "number") return user;
  if (!user || typeof user !== "object") return user;

  const requestBody = parseRequestBodyOrRespond(event);
  if (typeof requestBody !== "object") return requestBody;

  const uidValidation = validateUidOrRespond(requestBody, event);
  if (uidValidation) return uidValidation;

  return respond(200, {
    uid: user.uid,
    email: user.email,
    username: user.username,
    bio: user.bio || "",
    profilePicture: null,
    bannerImage: null,
  });
};
