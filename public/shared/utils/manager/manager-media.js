import {
  validateImageFile,
  validateMediaDimensions,
  validateMediaFile,
} from "../auth/media-validation/index.js";

function setupMediaHandlerInstance([
  container,
  input,
  maxFiles = 4,
  allowedTypes = ["image/", "video/"],
  maxFileSize = 5 * 1024 * 1024,
]) {
  if (!container || !input)
    throw new Error("MediaHandler needs a container and input");

  this.container = container;
  this.input = input;
  this.maxFiles = maxFiles;
  this.allowedTypes = allowedTypes;
  this.maxFileSize = maxFileSize;

  this.uploadedFiles = [];
  this.fileURLs = new Map();

  this.template = document.querySelector(".media-preview_template");
  if (!this.template)
    throw new Error("Media preview template not found in DOM");

  this.input.addEventListener("change", (e) => this.handleUpload(e));
  window.addEventListener("beforeUnload", () => this.clearURLs());
}

function createMediaPreviewElement(file, url) {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (!isImage && !isVideo) {
    alert(`Unsupported file type: ${file.type}`);
    URL.revokeObjectURL(url);
    return null;
  }

  const el = isImage
    ? document.createElement("img")
    : document.createElement("video");
  el.src = url;

  if (isImage) {
    el.setAttribute("loading", "lazy");
    el.setAttribute("decoding", "async");
  }

  if (isVideo) {
    el.controls = true;
    el.setAttribute("preload", "metadata");
    return el;
  }

  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.appendChild(el);

  return link;
}

async function handleAndAddMediaFile(ctx, file) {
  const validationResult = await ctx.validateFile(file);
  if (!validationResult.isValid) {
    alert(`File rejected: ${validationResult.reason}`);
    return;
  }

  if (ctx.isDuplicate(file)) {
    alert("This file has already been uploaded.");
    return;
  }

  if (file.type.startsWith("image/")) {
    const dimensionCheck = await validateMediaDimensions(file);
    if (!dimensionCheck.isValid) {
      alert(`Image rejected: ${dimensionCheck.reason}`);
      return;
    }
  }

  const url = URL.createObjectURL(file);
  ctx.uploadedFiles.push(file);
  ctx.fileURLs.set(file, url);

  const clone = ctx.template.cloneNode(true);
  clone.classList.remove("media-preview_template");
  const storage = clone.querySelector(".mediaStorage");
  const trashBtn = clone.querySelector(".mediaPreviewTrashcan");

  if (!storage || !trashBtn) {
    console.warn("Cloned template missing required elements");
    return;
  }

  const mediaEl = ctx.createMediaElement(file, url);
  if (!mediaEl) return;

  storage.innerHTML = "";
  storage.appendChild(mediaEl);

  trashBtn.addEventListener("click", (e) => {
    e.preventDefault();
    ctx.removeFile(file, clone);
  });

  ctx.container.appendChild(clone);

  const fourthBox = document.querySelector(".fourth-box_wrapper-writer");
  if (fourthBox) {
    fourthBox.style.display = "flex";
  }
}

function removeFileAndCleanup(ctx, file, element) {
  const url = ctx.fileURLs.get(file);
  if (url) URL.revokeObjectURL(url);
  ctx.fileURLs.delete(file);
  ctx.uploadedFiles = ctx.uploadedFiles.filter((f) => f !== file);

  if (element?.parentNode) {
    element.parentNode.removeChild(element);
  }
  if (ctx.uploadedFiles.length === 0) {
    const fourthBox = document.querySelector(".fourth-box_wrapper-writer");
    if (fourthBox) {
      fourthBox.style.display = "none";
    }
  }
}

class initMediaHandler {
  constructor(args) {
    setupMediaHandlerInstance.call(this, args);
  }

  async handleUpload(e) {
    const files = Array.from(e.target.files).slice(
      0,
      this.maxFiles - this.uploadedFiles.length
    );
    for (const file of files) {
      await handleAndAddMediaFile(this, file);
    }
    e.target.value = "";
  }

  async addFile(file) {
    await handleAndAddMediaFile(this, file);
  }

  async validateFile(file) {
    if (file.type.startsWith("image/")) {
      return await validateImageFile(file, this.maxFileSize);
    }

    return await validateMediaFile(file, this.allowedTypes, this.maxFileSize);
  }

  createMediaElement(file, url) {
    return createMediaPreviewElement(file, url);
  }

  isDuplicate(file) {
    return this.uploadedFiles.some(
      (f) => f.name === file.name && f.lastModified === file.lastModified
    );
  }

  removeFile(file, element) {
    removeFileAndCleanup(this, file, element);
  }

  clearURLs() {
    this.fileURLs.forEach((url) => URL.revokeObjectURL(url));
    this.fileURLs.clear();
  }

  getFiles() {
    return [...this.uploadedFiles];
  }

  clear() {
    this.uploadedFiles.forEach((f) => this.removeFile(f));
    this.uploadedFiles = [];
    this.container.innerHTML = "";
  }
}

export default initMediaHandler;
