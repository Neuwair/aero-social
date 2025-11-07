async function signOut(authClient) {
  try {
    authClient.currentUser = null;
    authClient.sessionId = null;

    try {
      authClient.clearAllClientStorage();
    } catch (e) {
      try {
        authClient.removeSessionCookie();
      } catch (er) {}
      try {
        authClient.removeCsrfCookie();
      } catch (er) {}
      try {
        localStorage.removeItem("userUid");
      } catch (er) {}
    }

    authClient.notifyListeners();

    return Promise.resolve();
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

export { signOut };
