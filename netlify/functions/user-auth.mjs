import {
  verifyDoubleSubmit,
  getTokenFromRequest,
} from "../utils/csrf/index.js";
import {
  getIpFromEvent,
  createErrorResponse,
  parseRequestBody,
} from "./user-auth-utils.mjs";
import {
  handleValidateUsername,
  handleLogin,
  handleRegister,
} from "./user-auth-utils.mjs";

export const handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    console.warn("[Suspicious Activity] userAuth: Non-POST request received", {
      method: event.httpMethod,
      ip: getIpFromEvent(event),
    });
    return createErrorResponse(405, "Method Not Allowed");
  }

  const csrfVerification = verifyDoubleSubmit(event);
  if (!csrfVerification.valid) {
    try {
      const tokens = getTokenFromRequest(event);
      console.warn("CSRF validation failed", {
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
      console.warn("CSRF logging failed", loggingError);
    }
    return createErrorResponse(403, "Invalid CSRF token");
  }

  let userData;
  try {
    userData = await parseRequestBody(event);
  } catch (parseError) {
    if (parseError.isBadRequest) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Invalid request body. Please check your input and try again.",
        }),
      };
    }
    return {
      statusCode: 400,
      body: JSON.stringify({ message: parseError.message || "Bad Request" }),
    };
  }

  if (userData.action === "validateUsername") {
    return await handleValidateUsername(userData);
  }

  if (userData.action === "login") {
    return await handleLogin(event, userData);
  }

  if (userData.action === "register") {
    return await handleRegister(userData);
  }

  try {
    return await handleRegister(userData);
  } catch (error) {
    console.error("Registration error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "An internal error occurred. Please try again later.",
      }),
    };
  }
};
