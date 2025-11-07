import { containsProfanity } from "./profanity-filter.mjs";
import { getUserByUsername } from "../utils/database.js";

const USERNAME_VALIDATION_RULES = {
  MIN_LENGTH: 5,
  MAX_LENGTH: 20,
  ALLOWED_PATTERN: /^[a-zA-Z0-9_]+$/,
  ERRORS: {
    INVALID_TYPE: "Username must be a string.",
    EMPTY: "Username cannot be empty.",
    TOO_SHORT: "Username must be at least 5 characters long.",
    TOO_LONG: "Username must be no more than 20 characters long.",
    INVALID_CHARACTERS:
      "Username can only contain letters, numbers, and underscores.",
    PROFANITY:
      "Username contains inappropriate language. Please choose a different one.",
    ALREADY_TAKEN: "This username is already taken.",
    SERVER_ERROR: "An error occurred while checking username availability.",
  },
};

function validateUsernameBasic(username) {
  if (typeof username !== "string") {
    return {
      isValid: false,
      error: USERNAME_VALIDATION_RULES.ERRORS.INVALID_TYPE,
    };
  }

  const trimmedUsername = username.trim();

  if (trimmedUsername === "") {
    return { isValid: false, error: USERNAME_VALIDATION_RULES.ERRORS.EMPTY };
  }

  if (trimmedUsername.length < USERNAME_VALIDATION_RULES.MIN_LENGTH) {
    return {
      isValid: false,
      error: USERNAME_VALIDATION_RULES.ERRORS.TOO_SHORT,
    };
  }

  if (trimmedUsername.length > USERNAME_VALIDATION_RULES.MAX_LENGTH) {
    return {
      isValid: false,
      error: USERNAME_VALIDATION_RULES.ERRORS.TOO_LONG,
    };
  }

  if (!USERNAME_VALIDATION_RULES.ALLOWED_PATTERN.test(trimmedUsername)) {
    return {
      isValid: false,
      error: USERNAME_VALIDATION_RULES.ERRORS.INVALID_CHARACTERS,
    };
  }

  return { isValid: true, error: null };
}

/**
 * @param {string} username
 * @param {object} db
 * @returns {Promise<string|null>}
 */
async function validateUsernameServerSide(username, db = null) {
  const basicValidation = validateUsernameBasic(username);
  if (!basicValidation.isValid) {
    return basicValidation.error;
  }

  const trimmedUsername = username.trim();
  if (containsProfanity(trimmedUsername)) {
    return USERNAME_VALIDATION_RULES.ERRORS.PROFANITY;
  }

  try {
    const existingUser = await getUserByUsername(trimmedUsername);
    if (existingUser) {
      return USERNAME_VALIDATION_RULES.ERRORS.ALREADY_TAKEN;
    }
  } catch (error) {
    console.error("Error checking username uniqueness:", error);
    return USERNAME_VALIDATION_RULES.ERRORS.SERVER_ERROR;
  }

  return null;
}

export { validateUsernameServerSide, validateUsernameBasic };
