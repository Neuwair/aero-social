import { authService } from "../utils/auth/index.js";
import { getFollowersSimulationState } from "../utils/database.js";

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, value] = cookie.trim().split("=");
    if (name && value) {
      try {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value);
      } catch (e) {
        cookies[name] = value;
      }
    }
  });
  return cookies;
}

function respond(statusCode, bodyObj) {
  return { statusCode, body: JSON.stringify(bodyObj) };
}

function checkMethod(event) {
  if (event.httpMethod !== "GET")
    return respond(405, { message: "Method not allowed" });
  return null;
}

async function verifySessionOrRespond(event) {
  const cookies = parseCookies(
    event.headers.cookie || event.headers.Cookie || ""
  );
  const sessionId = cookies.session;
  if (!sessionId) return { error: respond(401, { message: "No session" }) };
  const res = await authService.verifySession(sessionId);
  if (!res || !res.success)
    return { error: respond(401, { message: "Invalid session" }) };
  return { user: res.user };
}

export const handler = async (event, context) => {
  const methodCheck = checkMethod(event);
  if (methodCheck) return methodCheck;

  const session = await verifySessionOrRespond(event);
  if (session.error) return session.error;
  const user = session.user;

  try {
    const state = await getFollowersSimulationState(user.uid);
    return respond(200, { success: true, state });
  } catch (e) {
    try {
      console.error(
        "api-getFollowersSimulationState error:",
        e && e.stack ? e.stack : e
      );
    } catch (err) {
      console.error(
        "api-getFollowersSimulationState error (failed to print stack):",
        e
      );
    }
    const message =
      process.env.NODE_ENV === "production"
        ? "Failed to get followers simulation state"
        : (e && e.message) || "Failed to get followers simulation state";
    return respond(500, { success: false, message });
  }
};
