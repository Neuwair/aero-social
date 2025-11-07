import { initializeAuthWithAlert } from "../auth/account-auth-initializer.js";
import { loadImage } from "../upload/upload-avatar-banner.js";
import { timeObserver } from "../performance/time-observer.js";
import {
  addShowClassWithAnimation,
  removeShowClassWithDelay,
  animateElementsSequentially,
} from "../animations/animations.js";
import { fetchUsername } from "../helper/fetch-username.js";
import { setupDeleteButton } from "./delete-post.js";
import { setupHeartButton, likeObserver } from "./post-reactions.js";
import { updatePostButtonAlignment } from "../simulation/simulation-posts.js";

const createdURLs = [];

async function showPost() {
  const writerTextArea = document.getElementById("postTextArea");
  const postStorage = document.querySelector(".postStorage");
  if (!writerTextArea || !postStorage) {
    console.error("Required elements for creating a post were not found.");
    return;
  }
  const text = writerTextArea.value.trim();
  if (text === "") return;

  await initializeAuthWithAlert();
  const username = await fetchUsername();
  const postElement = createPostElement(username, text);
  if (!postElement) return;

  const mediaHandler = window.mediaHandler;
  const files = mediaHandler ? mediaHandler.getFiles() : [];
  const postURLs = addMediaToPost(postElement, files);
  setupDeleteButton(postElement, postURLs, createdURLs);
  postStorage.prepend(postElement);
  requestAnimationFrame(() => {
    postElement.classList.add("show");
  });
  writerTextArea.value = "";
  if (mediaHandler) mediaHandler.clear();
  setupHeartButton(postElement);
}

function createPostElement(username, text) {
  const postTemplate = document.getElementById("postTemplate");
  if (!postTemplate) {
    console.error("Post template not found. Make sure the file is loaded.");
    return null;
  }
  const postElement = postTemplate.content
    .cloneNode(true)
    .querySelector(".post-display");
  const usernameDisplays = postElement.querySelectorAll(".usernameDisplayPost");
  usernameDisplays.forEach((el) => {
    el.textContent = username || "Anonymous";
  });
  const img = postElement.querySelector(".userPostAvatar");
  loadImage("userAvatarImages").then((data) => {
    if (data) img.src = data;
  });
  const timestamp = Date.now();
  const timeElem = postElement.querySelector(".time-counter-storage-post");
  if (timeElem) {
    timeElem._timestamp = timestamp;
    timeObserver.observe(timeElem);
    try {
      if (likeObserver && typeof likeObserver.observe === "function") {
        likeObserver.observe(timeElem);
      }
    } catch (e) {}
  }
  postElement.querySelector(".storageText").textContent = text;
  try {
    updatePostButtonAlignment(postElement);
  } catch (e) {}
  return postElement;
}

function addMediaToPost(postElement, files) {
  const mediaContainer = postElement.querySelector(".mediaStoragePost");
  const postURLs = [];
  files.forEach((file) => {
    const url = URL.createObjectURL(file);
    postURLs.push(url);
    createdURLs.push(url);
    let el;
    if (file.type.startsWith("image/")) {
      el = document.createElement("img");
      el.src = url;
    } else if (file.type.startsWith("video/")) {
      el = document.createElement("video");
      el.src = url;
      el.controls = true;
    } else {
      return;
    }
    el.style.maxWidth = "100%";
    el.addEventListener("click", () => {
      window.open(url, "_blank");
    });
    mediaContainer.appendChild(el);
  });
  return postURLs;
}

function setupWriterButtons() {
  function waitForElements(maxAttempts = 10, interval = 100) {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const checkElements = () => {
        const newPostBtn = document.getElementById("buttonNewPost");
        const cancelPostBtn = document.getElementById("writerTrashCan");
        const writerDisplay = document.getElementById("injectPostWriter");
        const writerTextArea = document.getElementById("postTextArea");
        const sendPostBtn = document.getElementById("sendPost");

        if (
          newPostBtn &&
          cancelPostBtn &&
          sendPostBtn &&
          writerDisplay &&
          writerTextArea
        ) {
          resolve({
            newPostBtn,
            cancelPostBtn,
            writerDisplay,
            writerTextArea,
            sendPostBtn,
          });
        } else {
          attempts++;
          if (attempts >= maxAttempts) {
            reject(new Error("Post writer buttons not found after waiting"));
          } else {
            setTimeout(checkElements, interval);
          }
        }
      };

      checkElements();
    });
  }

  waitForElements()
    .then(
      ({
        newPostBtn,
        cancelPostBtn,
        writerDisplay,
        writerTextArea,
        sendPostBtn,
      }) => {
        const mediaHandler = window.mediaHandler;

        function showWriter() {
          if (writerDisplay) {
            writerDisplay.style.display = "flex";
            addShowClassWithAnimation(writerDisplay);
          }
        }

        function removeWriter() {
          if (writerDisplay) {
            removeShowClassWithDelay(writerDisplay);
          }
          if (writerTextArea) {
            writerTextArea.value = "";
          }
          if (mediaHandler) {
            mediaHandler.clear();
          }
        }

        newPostBtn.addEventListener("click", showWriter);
        cancelPostBtn.addEventListener("click", removeWriter);
        sendPostBtn.addEventListener("click", showPost);
      }
    )
    .catch((error) => {
      console.error(
        "Post writer buttons not found. Event listeners were not attached:",
        error.message
      );
    });
}

export {
  createdURLs,
  showPost,
  createPostElement,
  addMediaToPost,
  setupWriterButtons,
};

function animateExistingPosts() {
  const existingPosts = document.querySelectorAll(".post-display:not(.show)");
  animateElementsSequentially(existingPosts);
}

window.addEventListener("beforeunload", () => {
  createdURLs.forEach((url) => URL.revokeObjectURL(url));
  createdURLs.length = 0;
});

export { animateExistingPosts };
