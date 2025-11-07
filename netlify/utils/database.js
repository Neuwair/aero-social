import { neon } from "@neondatabase/serverless";

import { initializeTables, ensureTablesExist } from "./database/migrations.js";
import {
  createUser,
  getUserByEmail,
  getUserByUsername,
  getUserByUid,
  updateBioIfRecentlyCreated,
  deleteExpiredUsers,
} from "./database/users.js";
import {
  createSession,
  getSession,
  deleteSession,
  cleanExpiredSessions,
} from "./database/sessions.js";
import {
  addFriend,
  addPendingRequest,
  listPendingRequests,
  removePendingRequest,
  getFriendsCount,
} from "./database/friends.js";
import { addFollower, getFollowersCount } from "./database/followers.js";
import {
  setSimulationState,
  setFollowersSimulationState,
  getSimulationState,
  getFollowersSimulationState,
} from "./database/simulations.js";

let sql;

function getDatabase() {
  if (!sql) {
    const databaseUrl =
      process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("Database URL not found in environment variables");
    }
    sql = neon(databaseUrl);
  }
  return sql;
}

export {
  getDatabase,
  initializeTables,
  createUser,
  getUserByEmail,
  getUserByUsername,
  getUserByUid,
  updateBioIfRecentlyCreated,
  createSession,
  getSession,
  deleteSession,
  cleanExpiredSessions,
  deleteExpiredUsers,
  addFriend,
  addFollower,
  getFriendsCount,
  getFollowersCount,
  addPendingRequest,
  listPendingRequests,
  removePendingRequest,
  setSimulationState,
  setFollowersSimulationState,
  getSimulationState,
  getFollowersSimulationState,
};
