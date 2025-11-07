import { DEFAULT_MAX_FILE_SIZE } from "./constants.js";

export function validateFileSize(file, maxFileSize = DEFAULT_MAX_FILE_SIZE) {
  return file.size > 0 && file.size <= maxFileSize;
}

export function getFileSizeError(file, maxFileSize = DEFAULT_MAX_FILE_SIZE) {
  if (file.size === 0) {
    return "File is empty.";
  }
  if (file.size > maxFileSize) {
    return `File size exceeds ${Math.round(
      maxFileSize / 1024 / 1024
    )}MB limit.`;
  }
  return "";
}
