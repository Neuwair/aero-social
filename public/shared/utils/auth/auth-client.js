import { setupAuthSessionMonitor } from "../helper/auth-session-monitor.js";
import { setupAuthPublicApi } from "../helper/auth-public-api.js";
import { signInWithEmailAndPassword as performSignIn } from "../connections/sign-in.js";
import { createUserWithEmailAndPassword as performSignUp } from "../connections/sign-up.js";
import { signOut as performSignOut } from "../connections/sign-out.js";
import {
  getSessionFromCookie,
  setSessionCookie,
  removeSessionCookie,
  removeCsrfCookie,
  getCsrfFromCookie,
} from "../manager/manager-cookies.js";
import {
  checkSession as performSessionCheck,
  createSessionDataFetcher,
  applySessionUser,
  clearSessionState,
  hasStoredUserUid,
} from "../connections/session-client.js";
import { clearClientStateAfterDeletion } from "../security/delete-expired-users.js";

class AuthClient {
  constructor() {
    this.currentUser = null;
    this.sessionId = null;
    this.listeners = new Set();

    this._userDataFetcher = createSessionDataFetcher();
    this.checkSession();
    setupAuthSessionMonitor(this);
  }

  getSessionFromCookie() {
    try {
      return getSessionFromCookie();
    } catch (e) {
      return null;
    }
  }

  setSessionCookie(sessionId, maxAge = 7 * 24 * 60 * 60) {
    try {
      return setSessionCookie(sessionId, maxAge);
    } catch (e) {
      return null;
    }
  }

  removeSessionCookie() {
    try {
      return removeSessionCookie();
    } catch (e) {
      return null;
    }
  }

  removeCsrfCookie() {
    try {
      return removeCsrfCookie();
    } catch (e) {
      return null;
    }
  }

  clearAllClientStorage() {
    clearClientStateAfterDeletion(removeSessionCookie, removeCsrfCookie);
  }

  _hasStoredUserUid() {
    return hasStoredUserUid();
  }

  async checkSession() {
    return performSessionCheck(this);
  }

  handleSessionClear() {
    clearSessionState(this);
  }

  updateSessionUser(userData, sessionId) {
    applySessionUser(this, userData, sessionId);
  }

  async _getCsrfTokenFromSecureApi() {
    const { secureAPI } = await import("../api/api-csrf.js");
    return await secureAPI.getCsrfToken();
  }

  _setCurrentUserFromData(userData) {
    applySessionUser(this, userData, this.sessionId);
  }

  _clearCurrentUserAndSession() {
    this.handleSessionClear();
  }

  getCsrfToken() {
    try {
      return getCsrfFromCookie();
    } catch (e) {
      return null;
    }
  }

  async signInWithEmailAndPassword(email, password) {
    return performSignIn(this, email, password);
  }

  async createUserWithEmailAndPassword(email, password, username, bio = "") {
    return performSignUp(this, email, password, username, bio);
  }

  async signOut() {
    return performSignOut(this);
  }

  onAuthStateChanged(callback) {
    this.listeners.add(callback);

    Promise.resolve().then(() => callback(this.currentUser));

    return () => {
      this.listeners.delete(callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach((callback) => {
      try {
        callback(this.currentUser);
      } catch (error) {
        console.error("Error in auth state listener:", error);
      }
    });
  }

  getCurrentUser() {
    return this.currentUser;
  }
}

const authInstance = new AuthClient();
const auth = setupAuthPublicApi(authInstance);

export { auth, AuthClient };
export default auth;
