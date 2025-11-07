import { displayUserData } from "../utils/auth/display-user-data.js";
import {
  enableAvatarProfile,
  enableBannerProfile,
} from "../utils/upload/upload-avatar-banner.js";
import { biographyHandler } from "../utils/manager/manager-biography.js";
import { initEmojiPickerBio } from "../utils/manager/manager-emoji.js";
import { enableGalleryNavigation } from "../utils/api/api-gallery.js";
import initializeFollowersSimulation from "../utils/simulation/simulation-followers.js";

function injectUserProfile(selector, filePath) {
  return new Promise((resolve, reject) => {
    const container = document.querySelector(selector);
    if (!container) {
      console.error(`Container not found for selector: ${selector}`);
      reject(`No container for selector: ${selector}`);
      return;
    }

    fetch(filePath)
      .then((res) => {
        if (!res.ok)
          throw new Error(`Failed to load ${filePath}: ${res.status}`);
        return res.text();
      })
      .then((html) => {
        container.innerHTML = html;
        resolve();
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  injectUserProfile(
    "#injectUserProfile",
    "/shared/components/global-inject-user-profile.html"
  )
    .then(() => {
      requestAnimationFrame(async () => {
        enableAvatarProfile();
        enableBannerProfile();
        try {
          await displayUserData();
        } catch (e) {
          console.warn("displayUserData failed:", e);
        }
        biographyHandler();
        initEmojiPickerBio();
        enableGalleryNavigation();
        try {
          const sim = await initializeFollowersSimulation();
          if (sim && typeof sim.startIfAuthenticated === "function") {
            sim.startIfAuthenticated();
          }
        } catch (e) {
          console.warn("followers simulation failed to start:", e);
        }
      });
    })
    .catch((err) => {
      console.error("User profile injection failed:", err);
    });
});
