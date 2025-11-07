async function signInWithEmailAndPassword(authClient, email, password) {
  try {
    const { secureAPI } = await import("../api/api-csrf.js");
    const csrfToken = await secureAPI.getCsrfToken();

    const doRequest = async (token) =>
      fetch("/.netlify/functions/user-auth", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
        body: JSON.stringify({ action: "login", email, password }),
      });

    let response = await doRequest(csrfToken);

    if (response.status === 403) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData.message || "";
      if (
        msg.includes("Invalid CSRF token") ||
        msg.includes("Security validation failed")
      ) {
        try {
          await secureAPI.fetchCsrfToken();
          const refreshed = await secureAPI.getCsrfToken();
          response = await doRequest(refreshed);
        } catch (refreshErr) {
          console.error("CSRF refresh failed:", refreshErr);
        }
      }
    }

    const data = await response.json();

    if (response.ok) {
      authClient.currentUser = {
        uid: data.uid,
        email: data.email,
        username: data.username,
      };

      localStorage.setItem("userUid", data.uid);

      authClient.sessionId =
        data.sessionId || authClient.getSessionFromCookie();
      authClient.notifyListeners();

      return { user: authClient.currentUser };
    }

    throw new Error(data.message || "Login failed");
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

export { signInWithEmailAndPassword };
