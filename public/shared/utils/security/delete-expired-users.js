function clearClientStateAfterDeletion(removeSessionCookie, removeCsrfCookie) {
  try {
    try {
      if (typeof localStorage !== "undefined" && localStorage) {
        try {
          localStorage.clear();
        } catch (e) {
          try {
            localStorage.removeItem("userBio");
          } catch (er) {}
          try {
            localStorage.removeItem("userUid");
          } catch (er) {}
        }
      }
    } catch (e) {}

    try {
      sessionStorage.clear();
    } catch (e) {}

    try {
      if (
        typeof indexedDB !== "undefined" &&
        indexedDB &&
        indexedDB.deleteDatabase
      ) {
        try {
          indexedDB.deleteDatabase("avatarsDB");
        } catch (e) {
          console.warn("Failed to delete avatarsDB via deleteDatabase:", e);
        }
      }
    } catch (err) {
      console.warn("IndexedDB unavailable or deletion failed:", err);
    }

    try {
      if (typeof document !== "undefined") {
        const bioEl = document.getElementById("bioStorage");
        if (bioEl) bioEl.textContent = "";
        const followersEl = document.getElementById("followersCounter");
        if (followersEl) followersEl.textContent = "0";
        const friendsEl = document.getElementById("friendsCounter");
        if (friendsEl) friendsEl.textContent = "0";
        const avatarEl = document.getElementById("userAvatar");
        if (avatarEl) avatarEl.removeAttribute("src");
        const bannerEl = document.getElementById("userBanner");
        if (bannerEl) bannerEl.removeAttribute("src");
      }
    } catch (e) {}

    try {
      if (typeof removeSessionCookie === "function") {
        removeSessionCookie();
      }
    } catch (e) {}

    try {
      if (typeof removeCsrfCookie === "function") {
        removeCsrfCookie();
      }
    } catch (e) {}
  } catch (e) {
    console.error("Failed to clear client storage:", e);
  }
}

function redirectToIndex() {
  if (typeof window === "undefined") return;
  const target = "/index.html";
  const pathname = window.location.pathname || "";
  if (pathname === target) return;
  window.location.replace(target);
}

export { clearClientStateAfterDeletion, redirectToIndex };
