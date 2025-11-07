import { DEFAULT_ALLOWED_MEDIA_TYPES } from "./constants.js";

export function validateMimeType(
  file,
  allowedMimeTypes = DEFAULT_ALLOWED_MEDIA_TYPES
) {
  return allowedMimeTypes.includes(file.type);
}

export function getMimeTypeError(
  file,
  allowedMimeTypes = DEFAULT_ALLOWED_MEDIA_TYPES
) {
  if (!allowedMimeTypes.includes(file.type)) {
    return `Invalid file type. Expected media file, got: ${file.type}`;
  }
  return "";
}
