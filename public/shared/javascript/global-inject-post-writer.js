import { setupWriterButtons } from "../utils/post/create-post.js";
import { displayUserData } from "../utils/auth/display-user-data.js";
import { enableAvatarWriter } from "../utils/upload/upload-avatar-banner.js";
import { initEmojiPickerWriter } from "../utils/manager/manager-emoji.js";
import initMediaHandler from "../utils/manager/manager-media.js";

function injectPostWriter(selector, filePath) {
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
  injectPostWriter(
    "#injectPostWriter",
    "/shared/components/global-inject-post-writer.html"
  ).then(() => {
    displayUserData();
    enableAvatarWriter();

    requestAnimationFrame(() => {
      setupWriterButtons();

      const container = document.querySelector(
        `#injectPostWriter #writerMediaTemplate`
      );
      const input = document.querySelector("#injectPostWriter #uploadFile");

      if (container && input) {
        window.mediaHandler = new initMediaHandler([container, input]);
      } else {
        console.error("Media handler container or input not found");
      }
      initEmojiPickerWriter();

      const writerDisplay = document.getElementById("injectPostWriter");
      if (writerDisplay) {
        writerDisplay.style.display = "none";
        writerDisplay.classList.remove("show");
      }
    });
  });
});
