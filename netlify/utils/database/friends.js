import { getDatabase } from "../database.js";
import { ensureTablesExist } from "./migrations.js";

async function addFriend({ userUid, friendUsername, friendAvatar = null }) {
  const sql = getDatabase();
  try {
    await ensureTablesExist();
    const existing = await sql`
			SELECT id, user_uid, friend_username, friend_avatar, created_at
			FROM accepted_friends
			WHERE user_uid = ${userUid} AND friend_username = ${friendUsername}
			LIMIT 1
		`;
    if (existing && existing[0]) {
      return existing[0];
    }

    const result = await sql`
			INSERT INTO accepted_friends (user_uid, friend_username, friend_avatar)
			VALUES (${userUid}, ${friendUsername}, ${friendAvatar})
			RETURNING id, user_uid, friend_username, friend_avatar, created_at
		`;

    try {
      await sql`
				DELETE FROM pending_friend_requests
				WHERE user_uid = ${userUid} AND requester_username = ${friendUsername}
			`;
    } catch (e) {
      console.warn(
        "Failed to remove pending requests after accepting friend:",
        e
      );
    }

    return result[0] || null;
  } catch (error) {
    console.error("Error adding friend:", error);
    throw new Error("Failed to add friend");
  }
}

async function addPendingRequest({
  userUid,
  requesterUsername,
  requesterAvatar = null,
}) {
  const sql = getDatabase();
  try {
    await ensureTablesExist();
    const alreadyFriend = await sql`
			SELECT 1 FROM accepted_friends WHERE user_uid = ${userUid} AND friend_username = ${requesterUsername} LIMIT 1
		`;
    if (alreadyFriend && alreadyFriend[0]) {
      return null;
    }

    const existing = await sql`
			SELECT id, user_uid, requester_username, requester_avatar, created_at
			FROM pending_friend_requests
			WHERE user_uid = ${userUid} AND requester_username = ${requesterUsername}
			LIMIT 1
		`;
    if (existing && existing[0]) {
      return existing[0];
    }

    const result = await sql`
			INSERT INTO pending_friend_requests (user_uid, requester_username, requester_avatar)
			VALUES (${userUid}, ${requesterUsername}, ${requesterAvatar})
			RETURNING id, user_uid, requester_username, requester_avatar, created_at
		`;
    return result[0] || null;
  } catch (error) {
    console.error("Error adding pending request:", error);
    throw new Error("Failed to add pending request");
  }
}

async function listPendingRequests(userUid) {
  const sql = getDatabase();
  try {
    await ensureTablesExist();
    const rows = await sql`
			SELECT id, requester_username, requester_avatar, created_at
			FROM pending_friend_requests
			WHERE user_uid = ${userUid}
			ORDER BY created_at ASC
		`;
    return rows || [];
  } catch (error) {
    console.error("Error listing pending requests:", error);
    throw new Error("Failed to list pending requests");
  }
}

async function removePendingRequest(id) {
  const sql = getDatabase();
  try {
    await ensureTablesExist();
    await sql`
			DELETE FROM pending_friend_requests WHERE id = ${id}
		`;
    return { success: true };
  } catch (error) {
    console.error("Error removing pending request:", error);
    throw new Error("Failed to remove pending request");
  }
}

async function getFriendsCount(userUid) {
  const sql = getDatabase();
  try {
    await ensureTablesExist();
    const result = await sql`
			SELECT COUNT(*)::int AS cnt FROM accepted_friends WHERE user_uid = ${userUid}
		`;
    return result && result[0] ? result[0].cnt : 0;
  } catch (error) {
    console.error("Error getting friends count:", error);
    return 0;
  }
}

export {
  addFriend,
  addPendingRequest,
  listPendingRequests,
  removePendingRequest,
  getFriendsCount,
};
