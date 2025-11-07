import { getDatabase } from "../database.js";
import { ensureTablesExist } from "./migrations.js";

async function createSession({ sessionId, userUid, expiresAt }) {
  const sql = getDatabase();

  try {
    await ensureTablesExist();

    await sql`
			INSERT INTO user_sessions (session_id, user_uid, expires_at)
			VALUES (${sessionId}, ${userUid}, ${expiresAt})
		`;

    return { success: true };
  } catch (error) {
    console.error("Error creating session:", error);
    throw new Error("Failed to create session");
  }
}

async function getSession(sessionId) {
  const sql = getDatabase();

  try {
    await ensureTablesExist();
    const result = await sql`
			SELECT s.session_id, s.user_uid, s.expires_at, s.created_at,
						 u.email, u.username, u.bio
			FROM user_sessions s
			JOIN users u ON s.user_uid = u.uid
			WHERE s.session_id = ${sessionId}
			AND s.expires_at > CURRENT_TIMESTAMP
		`;
    if (!result[0]) {
      console.warn(
        "[DEBUG] getSession: No session found for sessionId",
        sessionId
      );
    } else {
      console.log("[DEBUG] getSession: Session found:", result[0]);
    }
    return result[0] || null;
  } catch (error) {
    console.error("Error getting session:", error);
    throw new Error("Failed to get session");
  }
}

async function deleteSession(sessionId) {
  const sql = getDatabase();

  try {
    await sql`
			DELETE FROM user_sessions
			WHERE session_id = ${sessionId}
		`;

    return { success: true };
  } catch (error) {
    console.error("Error deleting session:", error);
    throw new Error("Failed to delete session");
  }
}

async function cleanExpiredSessions() {
  const sql = getDatabase();

  try {
    await sql`
			DELETE FROM user_sessions
			WHERE expires_at <= CURRENT_TIMESTAMP
		`;

    return { success: true };
  } catch (error) {
    console.error("Error cleaning expired sessions:", error);
    return { success: false };
  }
}

export { createSession, getSession, deleteSession, cleanExpiredSessions };
