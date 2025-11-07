import { deleteExpiredUsers } from "../utils/database.js";
import { validateUsernameServerSide } from "./username-validate.mjs";
import { authService } from "../utils/auth/index.js";
import { setSecureCookie } from "./cookie-builder.mjs";

export async function handleValidateUsername(userData) {
  const username = sanitizeUsername(userData.username);

  if (!username) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        valid: false,
        message: "Username cannot be empty.",
      }),
    };
  }

  const validationError = await validateUsernameServerSide(username, null);
  if (validationError) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        valid: false,
        message: validationError,
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      valid: true,
      message: "Username is available.",
    }),
  };
}

export async function handleLogin(event, userData) {
  await deleteExpiredUsers();
  let email = sanitizeEmail(userData.email);
  let password =
    typeof userData.password === "string" ? userData.password.trim() : "";

  if (!isPasswordValid(password)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid password format." }),
    };
  }

  if (email.length > 100 || password.length > 100) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Input too long." }),
    };
  }
  if (!email || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing email or password." }),
    };
  }

  try {
    const loginResult = await authService.loginUser({ email, password });

    if (!loginResult.success) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Invalid email or password." }),
      };
    }

    const cookieHeader = setSecureCookie("session", loginResult.sessionId, {
      maxAge: 60 * 60 * 24 * 7,
    });

    return {
      statusCode: 200,
      headers: {
        "Set-Cookie": cookieHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Login successful!",
        uid: loginResult.user.uid,
        email: loginResult.user.email,
        username: loginResult.user.username,
        sessionId: loginResult.sessionId,
      }),
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Invalid email or password." }),
    };
  }
}

export async function handleRegister(userData) {
  await deleteExpiredUsers();
  let username = sanitizeUsername(userData.username);
  let email = sanitizeEmail(userData.email);
  let password =
    typeof userData.password === "string" ? userData.password.trim() : "";
  let bio = sanitizeBio(userData.bio);

  if (!isPasswordValid(password)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid password format." }),
    };
  }

  if (
    username.length > 30 ||
    email.length > 100 ||
    password.length > 100 ||
    bio.length > 200
  ) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Input too long." }),
    };
  }
  if (!username || !email || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required fields" }),
    };
  }

  const usernameValidationError = await validateUsernameServerSide(username);
  if (usernameValidationError) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: usernameValidationError }),
    };
  }

  const registerResult = await authService.registerUser({
    email,
    password,
    username,
    bio,
  });

  if (!registerResult.success) {
    if (registerResult.error.includes("already exists")) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: registerResult.error }),
      };
    }
    return {
      statusCode: 400,
      body: JSON.stringify({ message: registerResult.error }),
    };
  }

  const loginResult = await authService.loginUser({ email, password });

  if (loginResult.success) {
    const cookieHeader = setSecureCookie("session", loginResult.sessionId, {
      maxAge: 60 * 60 * 24 * 7,
    });

    return {
      statusCode: 200,
      headers: {
        "Set-Cookie": cookieHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "User registered successfully!",
        uid: loginResult.user.uid,
        email: loginResult.user.email,
        username: loginResult.user.username,
        bio: loginResult.user.bio,
        sessionId: loginResult.sessionId,
      }),
    };
  } else {
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "User registered successfully! Please log in.",
        uid: registerResult.user.uid,
        email: registerResult.user.email,
        username: registerResult.user.username,
      }),
    };
  }
}
import { sanitizeString } from "./sanitize-input.mjs";

export function getIpFromEvent(event) {
  return (
    event.headers["x-forwarded-for"] || event.headers["client-ip"] || "unknown"
  );
}

export function createErrorResponse(statusCode, message) {
  return {
    statusCode,
    body: JSON.stringify({ message }),
  };
}

export async function parseRequestBody(event) {
  if (!event.body) {
    console.warn("[Suspicious Activity] userAuth: Empty request body", {
      ip: getIpFromEvent(event),
    });
    throw new Error("Request body is empty or null.");
  }
  try {
    return typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch (parseError) {
    console.warn(
      "[Suspicious Activity] userAuth: Malformed JSON in request body",
      {
        error: parseError.message,
        ip: getIpFromEvent(event),
      }
    );
    console.error("Failed to parse event body:", event.body, parseError);
    const err = new Error("Invalid request body");
    err.isBadRequest = true;
    throw err;
  }
}

export function sanitizeEmail(email) {
  return sanitizeString(email ? email.toLowerCase() : "", {
    maxLength: 100,
    asciiOnly: true,
    removeDangerous: true,
  });
}

export function sanitizeUsername(username) {
  return sanitizeString(username, {
    maxLength: 30,
    asciiOnly: true,
    removeDangerous: true,
  }).replace(/[^a-zA-Z0-9_]/g, "");
}

export function sanitizeBio(bio) {
  return sanitizeString(bio, {
    maxLength: 200,
    removeDangerous: true,
  });
}

export function isPasswordValid(password) {
  if (typeof password !== "string") return false;
  if (password.length === 0 || password.length > 128) return false;
  if (/[\u0000-\u001F\u007F]/.test(password)) return false;
  return true;
}
