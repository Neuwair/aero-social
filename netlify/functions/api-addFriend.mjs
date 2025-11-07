import { authService } from "../utils/auth/index.js";
import { addFriend } from "../utils/database.js";

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
  return {
    statusCode,
    body: JSON.stringify(bodyObj),
  };
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

  const friendUsername = (body.friend_username || body.username || "")
    .toString()
    .trim();
  const friendAvatar = body.friend_avatar || body.avatar || null;
  if (!friendUsername)
    return respond(400, { message: "Missing friend username" });

  try {
    const added = await addFriend({
      userUid: user.uid,
      friendUsername,
      friendAvatar,
    });
    return respond(200, { success: true, friend: added });
  } catch (e) {
    console.error("api-addFriend error:", e);
    return respond(500, { success: false, message: "Failed to add friend" });
  }
};
