import { USER_DATA_ENDPOINT } from "../helper/fetch-user-data.js";
import { getCsrfFromCookie } from "../manager/manager-cookies.js";

class SecureAPIClient {
  constructor() {
    this.baseHeaders = {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    };
    this.csrfToken = null;
    this.csrfTokenExpiry = null;
  }

  getCsrfTokenFromCookie() {
    return getCsrfFromCookie();
  }

  async fetchCsrfToken() {
    try {
      const response = await fetch("/.netlify/functions/csrf-getToken", {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`);
      }

      const data = await response.json();
      this.csrfToken = data.csrfToken;
      this.csrfTokenExpiry = Date.now() + 23 * 60 * 60 * 1000;

      return this.csrfToken;
    } catch (error) {
      console.error("Error fetching CSRF token:", error);
      throw new Error("Failed to obtain CSRF token. Please refresh the page.");
    }
  }

  async getCsrfToken() {
    const cookieToken = this.getCsrfTokenFromCookie();

    if (
      this.csrfToken &&
      this.csrfTokenExpiry &&
      Date.now() < this.csrfTokenExpiry &&
      cookieToken === this.csrfToken
    ) {
      return this.csrfToken;
    }

    if (cookieToken) {
      this.csrfToken = cookieToken;
      this.csrfTokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
      return cookieToken;
    }

    this.csrfToken = null;
    this.csrfTokenExpiry = null;
    return await this.fetchCsrfToken();
  }

  async makeSecureRequest(endpoint, options = {}) {
    let csrfToken;
    try {
      csrfToken = await this.getCsrfToken();
    } catch (error) {
      throw new Error(
        "CSRF token required but could not be obtained. Please refresh the page."
      );
    }

    const config = {
      method: options.method || "POST",
      credentials: "include",
      headers: {
        ...this.baseHeaders,
        "x-csrf-token": csrfToken,
        ...options.headers,
      },
      ...options,
    };

    if (options.token) {
      config.headers["Authorization"] = `Bearer ${options.token}`;
    }

    try {
      const response = await fetch(endpoint, config);

      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        if (
          errorData.message &&
          (errorData.message.includes("Security validation failed") ||
            errorData.message.includes("Invalid CSRF token"))
        ) {
          this.csrfToken = null;
          this.csrfTokenExpiry = null;

          throw new Error(
            "Security validation failed. Please refresh the page and try again."
          );
        }
      }

      return response;
    } catch (error) {
      if (error.message.includes("Security validation failed")) {
        throw error;
      }
      throw new Error(`Network error: ${error.message}`);
    }
  }

  async validateUsername(username) {
    return this.makeSecureRequest("/.netlify/functions/user-auth", {
      method: "POST",
      body: JSON.stringify({
        action: "validateUsername",
        username: username,
      }),
    });
  }

  async checkEmail(email) {
    return this.makeSecureRequest("/.netlify/functions/email-check", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async fetchUserData(uid, token) {
    return this.makeSecureRequest(USER_DATA_ENDPOINT, {
      method: "POST",
      token: token,
      body: JSON.stringify({ uid }),
    });
  }
}

const secureAPI = new SecureAPIClient();

export { secureAPI, SecureAPIClient };
