import { getDatabase } from "../database.js";
import { ensureTablesExist } from "./migrations.js";

async function setSimulationState({
  userUid,
  activeElapsedMs = 0,
  lastStartedAt = null,
  stopAt = null,
  running = false,
}) {
  const sql = getDatabase();
  try {
    await ensureTablesExist();
    await sql`
			INSERT INTO friend_simulation_state (user_uid, active_elapsed_ms, last_started_at, stop_at, running)
			VALUES (${userUid}, ${activeElapsedMs}, ${lastStartedAt}, ${stopAt}, ${running})
			ON CONFLICT (user_uid)
			DO UPDATE SET active_elapsed_ms = ${activeElapsedMs}, last_started_at = ${lastStartedAt}, stop_at = ${stopAt}, running = ${running}
		`;
    return { success: true };
  } catch (error) {
    console.error("Error setting simulation state:", error);
    throw new Error("Failed to set simulation state");
  }
}

async function setFollowersSimulationState({
  userUid,
  activeElapsedMs = 0,
  lastStartedAt = null,
  stopAt = null,
  running = false,
}) {
  const sql = getDatabase();
  try {
    await ensureTablesExist();
    await sql`
			INSERT INTO followers_simulation_state (user_uid, active_elapsed_ms, last_started_at, stop_at, running)
			VALUES (${userUid}, ${activeElapsedMs}, ${lastStartedAt}, ${stopAt}, ${running})
			ON CONFLICT (user_uid)
			DO UPDATE SET active_elapsed_ms = ${activeElapsedMs}, last_started_at = ${lastStartedAt}, stop_at = ${stopAt}, running = ${running}
		`;
    return { success: true };
  } catch (error) {
    console.error("Error setting followers simulation state:", error);
    throw new Error("Failed to set followers simulation state");
  }
}

async function getSimulationState(userUid) {
  const sql = getDatabase();
  try {
    await ensureTablesExist();
    const rows = await sql`
			SELECT user_uid, active_elapsed_ms, last_started_at, stop_at, running
			FROM friend_simulation_state
			WHERE user_uid = ${userUid}
		`;
    return rows && rows[0] ? rows[0] : null;
  } catch (error) {
    console.error("Error getting simulation state:", error);
    throw new Error("Failed to get simulation state");
  }
}

async function getFollowersSimulationState(userUid) {
  const sql = getDatabase();
  try {
    await ensureTablesExist();
    const rows = await sql`
			SELECT user_uid, active_elapsed_ms, last_started_at, stop_at, running
			FROM followers_simulation_state
			WHERE user_uid = ${userUid}
		`;
    return rows && rows[0] ? rows[0] : null;
  } catch (error) {
    console.error("Error getting followers simulation state:", error);
    throw new Error("Failed to get followers simulation state");
  }
}

export {
  setSimulationState,
  setFollowersSimulationState,
  getSimulationState,
  getFollowersSimulationState,
};
