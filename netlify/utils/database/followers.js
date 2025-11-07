import { getDatabase } from "../database.js";
import { ensureTablesExist } from "./migrations.js";

async function addFollower({
  userUid,
  followerUsername,
  followerAvatar = null,
}) {
  const sql = getDatabase();
  try {
    await ensureTablesExist();
    const existing = await sql`
			SELECT id, user_uid, follower_username, follower_avatar, created_at
			FROM followers
			WHERE user_uid = ${userUid} AND follower_username = ${followerUsername}
			LIMIT 1
		`;
    if (existing && existing[0]) {
      return existing[0];
    }

    const result = await sql`
			INSERT INTO followers (user_uid, follower_username, follower_avatar)
			VALUES (${userUid}, ${followerUsername}, ${followerAvatar})
			RETURNING id, user_uid, follower_username, follower_avatar, created_at
		`;

    return result[0] || null;
  } catch (error) {
    console.error("Error adding follower:", error);
    throw new Error("Failed to add follower");
  }
}

async function getFollowersCount(userUid) {
  const sql = getDatabase();
  try {
    await ensureTablesExist();
    const result = await sql`
			SELECT COUNT(*)::int AS cnt FROM followers WHERE user_uid = ${userUid}
		`;
    return result && result[0] ? result[0].cnt : 0;
  } catch (error) {
    console.error("Error getting followers count:", error);
    return 0;
  }
}

export { addFollower, getFollowersCount };
