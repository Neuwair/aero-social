import { requestUserData } from "../helper/fetch-user-data.js";
import { initializeAuthWithAlert } from "./account-auth-initializer.js";
import { handleUserVerificationOnLoad } from "./account-auth.js";

async function displayUserData() {
  await initializeAuthWithAlert();
  const auth = window.auth;
  let user = auth.getCurrentUser();
  if (!user || !user.username) {
    user = await _fetchAndSetUser(auth);
  }
  if (user && user.username) {
    _displayUsername(user.username);
    try {
      const bioEl = document.getElementById("bioStorage");
      const BIO_KEY = "userBio";
      const serverBio = (user.bio || "").toString();
      let localBio = null;
      try {
        localBio = localStorage.getItem(BIO_KEY);
      } catch (e) {
        localBio = null;
      }

      if (localBio && localBio.toString().trim() !== "") {
        if (bioEl) bioEl.textContent = localBio;
      } else {
        if (bioEl) bioEl.textContent = serverBio;
        try {
          localStorage.setItem(BIO_KEY, serverBio);
        } catch (e) {}
      }
    } catch (e) {}
  }
}

async function _fetchAndSetUser(auth) {
  const csrfToken = await _getCsrfToken();
  const response = await _fetchUserData(csrfToken);
  if (response && response.ok) {
    const userData = await response.json();
    if (userData && userData.uid) {
      localStorage.setItem("userUid", userData.uid);
      auth.currentUser = {
        uid: userData.uid,
        email: userData.email,
        username: userData.username,
        bio: userData.bio || "",
        profilePicture: userData.profilePicture,
        bannerImage: userData.bannerImage,
      };
      try {
        const bioEl = document.getElementById("bioStorage");
        const BIO_KEY = "userBio";
        const serverBio = (userData.bio || "").toString();
        let localBio = null;
        try {
          localBio = localStorage.getItem(BIO_KEY);
        } catch (e) {
          localBio = null;
        }
        if (localBio && localBio.toString().trim() !== "") {
          if (bioEl) bioEl.textContent = localBio;
        } else {
          if (bioEl) bioEl.textContent = serverBio;
          try {
            localStorage.setItem(BIO_KEY, serverBio);
          } catch (e) {}
        }
      } catch (e) {}
      return auth.currentUser;
    }
  }
  return null;
}

async function _getCsrfToken() {
  const { secureAPI } = await import("../api/api-csrf.js");
  return await secureAPI.getCsrfToken();
}

async function _fetchUserData(csrfToken) {
  return requestUserData({ uid: null, csrfToken });
}

function _displayUsername(username) {
  const mainDisplay = document.getElementById("usernameDisplayMain");
  const writerDisplay = document.getElementById("usernameDisplayWriter");
  const allPostDisplays = document.querySelectorAll(".usernameDisplayPost");
  if (mainDisplay) mainDisplay.textContent = username;
  if (writerDisplay) writerDisplay.textContent = username;
  allPostDisplays.forEach((element) => {
    element.textContent = username;
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const isVerified = await handleUserVerificationOnLoad();
  if (isVerified) {
    await displayUserData();
  }
});

export { displayUserData };
