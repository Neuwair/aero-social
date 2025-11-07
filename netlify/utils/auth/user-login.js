import { getUserByEmail, createSession } from "../database.js";
import { verifyPassword } from "./password-utils.js";
import { generateSessionId } from "./generators.js";
import { SESSION_EXPIRY_MS } from "./constants.js";

export async function loginUser({ email, password }) {
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return { success: false, error: "Invalid email or password" };
    }

    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);

    await createSession({
      sessionId,
      userUid: user.uid,
      expiresAt,
    });

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        username: user.username,
        bio: user.bio,
      },
      sessionId,
      expiresAt,
    };
  } catch (error) {
    console.error("Error logging in user:", error);
    return { success: false, error: "Login failed" };
  }
}
