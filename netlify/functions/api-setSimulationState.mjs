import { authService } from "../utils/auth/index.js";
import { setSimulationState, getSimulationState } from "../utils/database.js";

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
  if (event.httpMethod !== "POST")
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

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return respond(400, { message: "Invalid JSON" });
  }

  const activeElapsedMs = Number.isFinite(Number(body.activeElapsedMs))
    ? parseInt(body.activeElapsedMs, 10)
    : 0;

  let lastStartedAt = null;
  if (body.lastStartedAt) {
    const parsed = new Date(body.lastStartedAt);
    if (!Number.isNaN(parsed.getTime())) lastStartedAt = parsed;
  }

  let stopAt = null;
  if (body.stopAt) {
    const parsedStop = new Date(body.stopAt);
    if (!Number.isNaN(parsedStop.getTime())) stopAt = parsedStop;
  }

  const running = Boolean(body.running);

  try {
    await setSimulationState({
      userUid: user.uid,
      activeElapsedMs,
      lastStartedAt,
      stopAt,
      running,
    });
    const state = await getSimulationState(user.uid);
    return respond(200, { success: true, state });
  } catch (e) {
    try {
      console.error(
        "api-setSimulationState error:",
        e && e.stack ? e.stack : e
      );
    } catch (err) {
      console.error("api-setSimulationState error (failed to print stack):", e);
    }
    const message =
      process.env.NODE_ENV === "production"
        ? "Failed to set simulation state"
        : (e && e.message) || "Failed to set simulation state";
    return respond(500, {
      success: false,
      message,
    });
  }
};
