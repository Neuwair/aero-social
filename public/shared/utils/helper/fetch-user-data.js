const USER_DATA_ENDPOINT = "/.netlify/functions/user-fetchData";
const DEFAULT_MIN_FETCH_INTERVAL = 500;
const BASE_BACKOFF_DELAY = 500;
const MAX_BACKOFF_DELAY = 16000;

async function requestUserData({ uid = null, csrfToken, fetchFn = fetch }) {
  return fetchFn(USER_DATA_ENDPOINT, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken ?? "",
    },
    body: JSON.stringify({ uid }),
  });
}

class UserDataFetcher {
  constructor({
    minFetchInterval = DEFAULT_MIN_FETCH_INTERVAL,
    fetchFn = fetch,
  } = {}) {
    this.minFetchInterval = minFetchInterval;
    this.fetchFn = fetchFn;
    this.lastFetchTime = 0;
    this.consecutive429 = 0;
  }

  async fetchResponse({ uid = null, csrfToken }) {
    const now = Date.now();
    const elapsed = now - this.lastFetchTime;
    if (elapsed < this.minFetchInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minFetchInterval - elapsed)
      );
    }

    this.lastFetchTime = Date.now();

    const response = await requestUserData({
      uid,
      csrfToken,
      fetchFn: this.fetchFn,
    });

    if (response.status === 429) {
      this.consecutive429 += 1;
      const delay = Math.min(
        MAX_BACKOFF_DELAY,
        BASE_BACKOFF_DELAY * 2 ** (this.consecutive429 - 1)
      );
      console.warn(
        `user-fetchData returned 429; client will wait ${delay}ms before allowing next request.`
      );
      this.lastFetchTime = Date.now() + delay;
    } else {
      this.consecutive429 = 0;
    }

    return response;
  }

  async fetchJson({ uid = null, csrfToken }) {
    const response = await this.fetchResponse({ uid, csrfToken });
    if (!response.ok) {
      return { data: null, response };
    }

    const data = await response.json();
    return { data, response };
  }
}

function createUserDataFetcher(options) {
  return new UserDataFetcher(options);
}

async function fetchCurrentUserDataForAuth(authClient) {
  try {
    if (!authClient || !authClient.sessionId) return null;

    let uid = null;
    try {
      uid = localStorage.getItem("userUid");
    } catch (e) {
      uid = null;
    }
    if (!uid) return null;

    const csrfToken = await authClient._getCsrfTokenFromSecureApi();
    const response = await authClient._userDataFetcher.fetchResponse({
      uid,
      csrfToken,
    });

    if (response.status === 429) {
      console.warn(
        "fetchCurrentUserData received 429; returning cached currentUser if available."
      );
      return authClient.currentUser;
    }

    if (response.ok) {
      const userData = await response.json();
      authClient._setCurrentUserFromData(userData);
      return authClient.currentUser;
    }

    if (
      response.status === 401 ||
      response.status === 404 ||
      response.status === 410
    ) {
      try {
        authClient._clearCurrentUserAndSession();
      } catch (e) {}
      return null;
    }

    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

export {
  USER_DATA_ENDPOINT,
  DEFAULT_MIN_FETCH_INTERVAL,
  requestUserData,
  UserDataFetcher,
  createUserDataFetcher,
  fetchCurrentUserDataForAuth,
};
