import crypto from "crypto";

function getClientIp(event) {
  return (
    event.headers["x-forwarded-for"] || event.headers["client-ip"] || "unknown"
  );
}

function jsonResponse(statusCode, payload, extraHeaders = {}) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Content-Type, X-Requested-With, x-csrf-token, Cookie",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    ...extraHeaders,
  };

  return {
    statusCode,
    headers,
    body: JSON.stringify(payload),
  };
}

function methodNotAllowedResponse() {
  return jsonResponse(405, {
    error: "Method not allowed",
    message: "Only GET requests are allowed",
  });
}

function internalServerErrorResponse() {
  return jsonResponse(500, {
    error: "Internal server error",
    message: "Unable to generate CSRF token",
  });
}

function successCsrfResponse(csrfToken) {
  return ({ origin } = {}) => {
    const isProd = process.env.NODE_ENV === "production";
    const secureFlag = isProd ? "Secure; " : "";
    const cookieHeader = `csrf_token=${encodeURIComponent(
      csrfToken
    )}; Path=/; ${secureFlag}SameSite=Strict; Max-Age=${24 * 60 * 60}`;

    const headers = {
      "Access-Control-Allow-Origin": origin || "null",
      Vary: "Origin",
      "Access-Control-Allow-Credentials": "true",
      "Set-Cookie": cookieHeader,
    };

    return jsonResponse(
      200,
      {
        success: true,
        csrfToken,
        message: "CSRF token generated successfully",
      },
      headers
    );
  };
}

export const handler = async (event, context) => {
  const ip = getClientIp(event);

  if (event.httpMethod !== "GET") {
    return methodNotAllowedResponse();
  }

  try {
    const csrfToken = crypto.randomBytes(32).toString("hex");
    const requestOrigin =
      event.headers && (event.headers.origin || event.headers.Origin)
        ? event.headers.origin || event.headers.Origin
        : null;
    const responder = successCsrfResponse(csrfToken);
    return responder({ origin: requestOrigin });
  } catch (error) {
    console.error("Error generating CSRF token:", error);
    return internalServerErrorResponse();
  }
};
