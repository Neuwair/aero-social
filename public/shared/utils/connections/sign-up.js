async function createUserWithEmailAndPassword(
  authClient,
  email,
  password,
  username,
  bio = ""
) {
  try {
    const csrfToken = await authClient._getCsrfTokenFromSecureApi();
    const response = await registerUserRequest(
      email,
      password,
      username,
      bio,
      csrfToken
    );
    const data = await response.json();

    if (response.ok) {
      setCurrentUserFromRegistration(authClient, data, bio);
      await refreshCsrfTokenAfterRegistration();
      return { user: authClient.currentUser };
    }

    throw new Error(data.message || "Registration failed");
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

function registerUserRequest(email, password, username, bio, csrfToken) {
  return fetch("/.netlify/functions/user-auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify({
      action: "register",
      email,
      password,
      username,
      bio,
    }),
    credentials: "include",
  });
}

function setCurrentUserFromRegistration(authClient, data, fallbackBio) {
  authClient.currentUser = {
    uid: data.uid,
    email: data.email,
    username: data.username,
    bio: data.bio || fallbackBio,
  };
  localStorage.setItem("userUid", data.uid);
  authClient.sessionId = data.sessionId || authClient.getSessionFromCookie();
  authClient.notifyListeners();
}

async function refreshCsrfTokenAfterRegistration() {
  const { refreshCsrfToken } = await import("../security/initializer-csrf.js");
  await refreshCsrfToken();
}

export { createUserWithEmailAndPassword };
