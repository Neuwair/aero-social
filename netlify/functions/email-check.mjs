function getRequestIp(event) {
  return (
    event.headers["x-forwarded-for"] || event.headers["client-ip"] || "unknown"
  );
}

function makeResponse(statusCode, bodyObj) {
  return {
    statusCode,
    body: JSON.stringify(bodyObj),
  };
}

function handleNonPost(event, ip) {
  console.warn(`Non-POST request from ${ip}: ${event.httpMethod}`);
  return makeResponse(405, { message: "Method not allowed" });
}

function handleMalformedJson(error, ip) {
  console.warn(`Malformed JSON from ${ip}:`, error.message);
  return makeResponse(400, { message: "Invalid JSON in request body" });
}

function handleInvalidEmail(ip) {
  console.warn(`Invalid email format from ${ip}`);
  return makeResponse(400, { message: "Invalid email format" });
}

export const handler = async (event, context) => {
  const ip = getRequestIp(event);

  if (event.httpMethod !== "POST") {
    return handleNonPost(event, ip);
  }

  try {
    const { email } = JSON.parse(event.body || "{}");

    if (!email || typeof email !== "string") {
      return handleInvalidEmail(ip);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return handleInvalidEmail(ip);
    }

    return makeResponse(200, {
      available: true,
      message: "Email is available",
    });
  } catch (error) {
    return handleMalformedJson(error, ip);
  }
};
