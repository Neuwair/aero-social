import { createUser, updateBioIfRecentlyCreated } from "../database.js";
import { hashPassword } from "./password-utils.js";
import { generateUID } from "./generators.js";

export async function registerUser({ email, password, username, bio = "" }) {
  try {
    const passwordHash = await hashPassword(password);
    const uid = generateUID();

    const user = await createUser({
      uid,
      email: email.toLowerCase(),
      username,
      passwordHash,
      bio,
    });

    if (!bio || bio === "") {
      try {
        const updated = await updateBioIfRecentlyCreated(
          uid,
          "Enjoying the view!",
          5
        );
        if (updated && updated.success && updated.user) {
          return {
            success: true,
            user: {
              uid: updated.user.uid,
              email: updated.user.email,
              username: updated.user.username,
              bio: updated.user.bio,
            },
          };
        }
      } catch (error) {
        console.warn("Failed to set default bio after registration:", error);
      }
    }

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        username: user.username,
        bio: user.bio,
      },
    };
  } catch (error) {
    console.error("Error registering user:", error);
    if (error.message === "Email already exists") {
      return { success: false, error: "Email already exists" };
    }
    if (error.message === "Username already exists") {
      return { success: false, error: "Username already exists" };
    }
    return { success: false, error: "Registration failed" };
  }
}
