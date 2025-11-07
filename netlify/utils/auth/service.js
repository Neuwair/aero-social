import { SALT_ROUNDS, SESSION_EXPIRY_MS } from "./constants.js";
import { generateUID, generateSessionId, generateToken } from "./generators.js";
import { hashPassword, verifyPassword } from "./password-utils.js";
import { registerUser } from "./user-register.js";
import { loginUser } from "./user-login.js";
import { verifySession, logoutUser } from "./session-service.js";

class AuthService {
  constructor() {
    this.saltRounds = SALT_ROUNDS;
    this.sessionExpiry = SESSION_EXPIRY_MS;
  }

  generateUID() {
    return generateUID();
  }

  generateSessionId() {
    return generateSessionId();
  }

  generateToken() {
    return generateToken();
  }

  hashPassword(password) {
    return hashPassword(password);
  }

  verifyPassword(password, hashedPassword) {
    return verifyPassword(password, hashedPassword);
  }

  registerUser(options) {
    return registerUser(options);
  }

  loginUser(options) {
    return loginUser(options);
  }

  verifySession(sessionId) {
    return verifySession(sessionId);
  }

  logoutUser(sessionId) {
    return logoutUser(sessionId);
  }
}

const authService = new AuthService();

export { AuthService, authService };
