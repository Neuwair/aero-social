import { getDatabase } from "../database.js";
import { ensureTablesExist } from "./migrations.js";

async function createUser({ uid, email, username, passwordHash, bio = "" }) {
  const sql = getDatabase();

  try {
    await ensureTablesExist();

    const result = await sql`
			INSERT INTO users (uid, email, username, password_hash, bio)
			VALUES (${uid}, ${email.toLowerCase()}, ${username}, ${passwordHash}, ${bio})
			RETURNING uid, email, username, bio, created_at
		`;
    return result[0];
  } catch (error) {
    if (error.message.includes("duplicate key")) {
      if (error.message.includes("users_email_key")) {
        throw new Error("Email already exists");
      }
      if (error.message.includes("users_username_key")) {
        throw new Error("Username already exists");
      }
    }
    console.error("Error creating user:", error);
    throw new Error("Failed to create user");
  }
}

async function deleteExpiredUsers() {
  const sql = getDatabase();
  await ensureTablesExist();

  try {
    const expiredUsers =
      await sql`SELECT uid, email, username FROM users WHERE created_at < (CURRENT_TIMESTAMP - INTERVAL '10 minutes')`;

    if (!expiredUsers || expiredUsers.length === 0) {
      console.log("No expired users to delete.");
      return { deleted: 0 };
    }

    const expiredUids = expiredUsers.map((u) => u.uid);
    const expiredUsernames = expiredUsers
      .map((u) => u.username)
      .filter((name) => typeof name === "string" && name.trim().length > 0);
    const uniqueUsernames = Array.from(new Set(expiredUsernames));

    if (expiredUids.length > 0) {
      await sql.query("DELETE FROM user_sessions WHERE user_uid = ANY($1)", [
        expiredUids,
      ]);
      await sql.query(
        "DELETE FROM friend_simulation_state WHERE user_uid = ANY($1)",
        [expiredUids]
      );
      await sql.query(
        "DELETE FROM followers_simulation_state WHERE user_uid = ANY($1)",
        [expiredUids]
      );
      await sql.query("DELETE FROM followers WHERE user_uid = ANY($1)", [
        expiredUids,
      ]);
      await sql.query("DELETE FROM accepted_friends WHERE user_uid = ANY($1)", [
        expiredUids,
      ]);
      await sql.query(
        "DELETE FROM pending_friend_requests WHERE user_uid = ANY($1)",
        [expiredUids]
      );
    }

    if (uniqueUsernames.length > 0) {
      await sql.query(
        "DELETE FROM followers WHERE follower_username = ANY($1)",
        [uniqueUsernames]
      );
      await sql.query(
        "DELETE FROM accepted_friends WHERE friend_username = ANY($1)",
        [uniqueUsernames]
      );
      await sql.query(
        "DELETE FROM pending_friend_requests WHERE requester_username = ANY($1)",
        [uniqueUsernames]
      );
    }

    await sql.query("DELETE FROM users WHERE uid = ANY($1)", [expiredUids]);

    return { deleted: expiredUids.length, uids: expiredUids };
  } catch (error) {
    console.error("Error deleting expired users:", error);
    throw error;
  }
}

async function getUserByEmail(email) {
  const sql = getDatabase();

  try {
    await ensureTablesExist();

    const result = await sql`
			SELECT uid, email, username, password_hash, bio, created_at
			FROM users
			WHERE email = ${email.toLowerCase()}
		`;

    return result[0] || null;
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw new Error("Failed to get user");
  }
}

async function getUserByUsername(username) {
  const sql = getDatabase();

  try {
    await ensureTablesExist();

    const result = await sql`
			SELECT uid, email, username, bio, created_at
			FROM users
			WHERE username = ${username}
		`;

    return result[0] || null;
  } catch (error) {
    console.error("Error getting user by username:", error);
    throw new Error("Failed to get user");
  }
}

async function getUserByUid(uid) {
  const sql = getDatabase();

  try {
    const result = await sql`
			SELECT uid, email, username, bio, created_at
			FROM users
			WHERE uid = ${uid}
		`;

    return result[0] || null;
  } catch (error) {
    console.error("Error getting user by UID:", error);
    throw new Error("Failed to get user");
  }
}

async function updateBioIfRecentlyCreated(
  uid,
  defaultBio = "Enjoying the view!",
  windowMinutes = 5
) {
  const sql = getDatabase();
  try {
    await ensureTablesExist();
    const result = await sql`
			SELECT uid, bio, created_at
			FROM users
			WHERE uid = ${uid}
		`;
    const user = result[0];
    if (!user) return { success: false, message: "User not found" };

    const createdAt = new Date(user.created_at);
    const now = new Date();
    const minutesSinceCreated = Math.floor((now - createdAt) / 60000);

    if (
      (user.bio === null || user.bio === "") &&
      minutesSinceCreated <= windowMinutes
    ) {
      await sql`
				UPDATE users
				SET bio = ${defaultBio}, updated_at = CURRENT_TIMESTAMP
				WHERE uid = ${uid}
			`;

      const updated = await sql`
				SELECT uid, email, username, bio, created_at
				FROM users
				WHERE uid = ${uid}
			`;
      return { success: true, user: updated[0] };
    }

    return { success: true, user };
  } catch (error) {
    console.error("Error updating bio if recently created:", error);
    return { success: false, message: "Failed to update bio" };
  }
}

export {
  createUser,
  deleteExpiredUsers,
  getUserByEmail,
  getUserByUsername,
  getUserByUid,
  updateBioIfRecentlyCreated,
};
