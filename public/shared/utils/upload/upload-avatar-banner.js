import { validateImageFile } from "../auth/media-validation/index.js";
import { getOrCreateDefaultPaths } from "./default-avatar-banner.js";

function imgStorageDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("avatarsDB", 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveImage(key, data) {
  return imgStorageDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction("images", "readwrite");
      const store = tx.objectStore("images");
      store.put(data, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

async function loadImage(key) {
  const db = await imgStorageDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction("images", "readonly");
      const store = tx.objectStore("images");
      const request = store.get(key);
      request.onsuccess = async () => {
        const result = request.result;
        if (result) return resolve(result);

        try {
          if (key === "userAvatarImages") {
            const defs = await getOrCreateDefaultPaths();
            return resolve(defs && defs.avatarPath ? defs.avatarPath : null);
          }
          if (key === "userBannerImages") {
            const defs = await getOrCreateDefaultPaths();
            return resolve(defs && defs.bannerPath ? defs.bannerPath : null);
          }
          return resolve(null);
        } catch (e) {
          return resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

function enableImageUpload({ element, storageKey, clickable = true }) {
  if (!element) return;

  loadImage(storageKey).then(async (savedData) => {
    if (savedData) {
      element.src = savedData;
      return;
    }

    try {
      const defaults = await getOrCreateDefaultPaths();
      if (!defaults) return;
      if (storageKey === "userAvatarImages" && defaults.avatarPath) {
        element.src = defaults.avatarPath;
      } else if (storageKey === "userBannerImages" && defaults.bannerPath) {
        element.src = defaults.bannerPath;
      }
    } catch (e) {}
  });

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".jpg,.jpeg,.png,.gif,.bmp,.webp";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    const validationResult = await validateImageFile(file);
    if (!validationResult.isValid) {
      alert(`File rejected: ${validationResult.reason}`);
      fileInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      element.src = data;
      saveImage(storageKey, data);

      reader.onload = null;
      reader.onerror = null;
    };

    reader.onerror = () => {
      alert("Error reading file");
      reader.onload = null;
      reader.onerror = null;
    };

    reader.readAsDataURL(file);
  });

  if (clickable) {
    element.addEventListener("click", () => fileInput.click());
  }

  element._fileInput = fileInput;
}

window.addEventListener("beforeunload", () => {
  const elements = document.querySelectorAll(
    '[id*="Avatar"], [id*="Banner"], [class*="Avatar"], [class*="Banner"]'
  );
  elements.forEach((element) => {
    if (element._fileInput && element._fileInput.parentNode) {
      element._fileInput.parentNode.removeChild(element._fileInput);
      element._fileInput = null;
    }
  });
});

function enableAvatarProfile() {
  enableImageUpload({
    element: document.getElementById("userAvatar"),
    storageKey: "userAvatarImages",
    clickable: true,
  });
}

function enableAvatarWriter() {
  enableImageUpload({
    element: document.getElementById("userWriterAvatar"),
    storageKey: "userAvatarImages",
    clickable: false,
  });
}

function enableAvatarPost() {
  enableImageUpload({
    element: document.querySelector(".userPostAvatar"),
    storageKey: "userAvatarImages",
    clickable: false,
  });
}

function enableBannerProfile() {
  enableImageUpload({
    element: document.getElementById("userBanner"),
    storageKey: "userBannerImages",
    clickable: true,
  });
}

export {
  enableAvatarWriter,
  enableAvatarProfile,
  enableAvatarPost,
  enableBannerProfile,
  loadImage,
};
