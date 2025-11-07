import { createUserDataFetcher as baseCreateUserDataFetcher } from "../helper/fetch-user-data.js";
import { redirectToIndex } from "../security/delete-expired-users.js";

let lastRedirectTs = 0;

function createSessionDataFetcher(options) {
  return baseCreateUserDataFetcher(options);
}

function hasStoredUserUid() {
  try {
    return Boolean(localStorage.getItem("userUid"));
  } catch (e) {
    return false;
  }
}

function applySessionUser(authClient, userData, sessionId) {
  localStorage.setItem("userUid", userData.uid);
  authClient.currentUser = {
    uid: userData.uid,
    email: userData.email,
    username: userData.username,
    bio: userData.bio || "",
    profilePicture: userData.profilePicture,
    bannerImage: userData.bannerImage,
  };
  authClient.sessionId = sessionId ?? authClient.sessionId;
  authClient.notifyListeners();
}

function clearSessionState(authClient) {
  authClient.currentUser = null;
  authClient.sessionId = null;
  authClient.clearAllClientStorage();
  authClient.notifyListeners();
  try {
    localStorage.removeItem("userUid");
  } catch (e) {}
  const now = Date.now();
  if (now - lastRedirectTs > 1000) {
    redirectToIndex();
    lastRedirectTs = now;
  }
}

async function checkSession(authClient) {
  try {
    const uid = localStorage.getItem("userUid");

    const sessionCookie = authClient.getSessionFromCookie();
    if (!sessionCookie && !uid) {
      return false;
    }

    const { secureAPI } = await import("../api/api-csrf.js");
    const csrfToken = await secureAPI.getCsrfToken();

    if (uid) {
      const response = await authClient._userDataFetcher.fetchResponse({
        uid,
        csrfToken,
      });
      if (
        response.status === 401 ||
        response.status === 404 ||
        response.status === 410
      ) {
        clearSessionState(authClient);
        return false;
      }

      if (response.status === 429) {
        console.warn(
          "Received 429 from user-fetchData; backing off client requests."
        );
        return false;
      }

      if (response.ok) {
        const userData = await response.json();
        if (userData && userData.uid) {
          const sessionId =
            userData.sessionId || authClient.getSessionFromCookie();
          applySessionUser(authClient, userData, sessionId);
          return true;
        }
      }

      return false;
    }

    const response = await authClient._userDataFetcher.fetchResponse({
      uid: null,
      csrfToken,
    });
    if (response && response.status === 429) {
      console.warn(
        "Received 429 when fetching anonymous user data; skipping clear."
      );
      return false;
    }

    if (
      response &&
      (response.status === 401 ||
        response.status === 404 ||
        response.status === 410)
    ) {
      clearSessionState(authClient);
      return false;
    }

    if (response && response.ok) {
      const userData = await response.json();
      if (userData && userData.uid) {
        const sessionId =
          userData.sessionId || authClient.getSessionFromCookie();
        applySessionUser(authClient, userData, sessionId);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking session:", error);
    return false;
  }
}

export {
  checkSession,
  createSessionDataFetcher,
  applySessionUser,
  clearSessionState,
  hasStoredUserUid,
};
