import { getDatabase } from "../database.js";

async function ensureTablesExist() {
  try {
    await initializeTables();
  } catch (error) {
    console.error("Error ensuring tables exist:", error);
    throw error;
  }
}

async function initializeTables() {
  const sql = getDatabase();

  try {
    await sql`
			CREATE TABLE IF NOT EXISTS users (
				uid VARCHAR(32) PRIMARY KEY,
				email VARCHAR(255) UNIQUE NOT NULL,
				username VARCHAR(20) UNIQUE NOT NULL,
				password_hash VARCHAR(255) NOT NULL,
				bio TEXT DEFAULT '',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`;

    await sql`
			CREATE TABLE IF NOT EXISTS user_sessions (
				session_id VARCHAR(64) PRIMARY KEY,
				user_uid VARCHAR(32) NOT NULL,
				expires_at TIMESTAMP NOT NULL,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
			)
		`;

    await sql`
			CREATE TABLE IF NOT EXISTS pending_friend_requests (
				id SERIAL PRIMARY KEY,
				user_uid VARCHAR(32) NOT NULL,
				requester_username VARCHAR(80) NOT NULL,
				requester_avatar VARCHAR(255),
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
			)
		`;

    await sql`
			CREATE TABLE IF NOT EXISTS friend_simulation_state (
				user_uid VARCHAR(32) PRIMARY KEY,
				active_elapsed_ms INTEGER DEFAULT 0,
				last_started_at TIMESTAMP,
				stop_at TIMESTAMP,
				running BOOLEAN DEFAULT FALSE,
				FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
			)
		`;

    try {
      await sql`ALTER TABLE friend_simulation_state ADD COLUMN IF NOT EXISTS stop_at TIMESTAMP`;
    } catch (e) {
      console.warn(
        "Could not ensure stop_at column exists (might already exist):",
        e && e.message ? e.message : e
      );
    }

    await sql`
			CREATE TABLE IF NOT EXISTS accepted_friends (
				id SERIAL PRIMARY KEY,
				user_uid VARCHAR(32) NOT NULL,
				friend_username VARCHAR(80) NOT NULL,
				friend_avatar VARCHAR(255),
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
			)
		`;

    await sql`
			CREATE TABLE IF NOT EXISTS followers_simulation_state (
				user_uid VARCHAR(32) PRIMARY KEY,
				active_elapsed_ms INTEGER DEFAULT 0,
				last_started_at TIMESTAMP,
				stop_at TIMESTAMP,
				running BOOLEAN DEFAULT FALSE,
				FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
			)
		`;

    await sql`
			CREATE TABLE IF NOT EXISTS followers (
				id SERIAL PRIMARY KEY,
				user_uid VARCHAR(32) NOT NULL,
				follower_username VARCHAR(80) NOT NULL,
				follower_avatar VARCHAR(255),
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
			)
		`;

    return { success: true };
  } catch (error) {
    console.error("Error initializing database tables:", error);
    throw new Error("Failed to initialize database tables");
  }
}

export { initializeTables, ensureTablesExist };
