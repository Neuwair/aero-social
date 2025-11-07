import { getSession, deleteSession } from "../database.js";

export async function verifySession(sessionId) {
  try {
    const session = await getSession(sessionId);
    if (!session) {
      console.warn(
        "[DEBUG] verifySession: No session returned for sessionId",
        sessionId
      );
      return { success: false, error: "Invalid or expired session" };
    }

    if (session && session.created_at) {
      const createdAt = new Date(session.created_at);
      const now = new Date();
      const minutesSinceCreated = Math.floor((now - createdAt) / 60000);
      console.log(
        `[DEBUG] verifySession: Session object:`,
        session,
        `| Minutes since created: ${minutesSinceCreated}`
      );
    } else {
      console.log("[DEBUG] verifySession: Session object:", session);
    }

    return {
      success: true,
      user: {
        uid: session.user_uid,
        email: session.email,
        username: session.username,
        bio: session.bio,
      },
    };
  } catch (error) {
    console.error("Error verifying session:", error);
    return { success: false, error: "Session verification failed" };
  }
}

export async function logoutUser(sessionId) {
  try {
    await deleteSession(sessionId);
    return { success: true };
  } catch (error) {
    console.error("Error logging out user:", error);
    return { success: false, error: "Logout failed" };
  }
}
