import {
  DEFAULT_ALLOWED_MEDIA_TYPES,
  DANGEROUS_MIME_TYPES,
  MEDIA_EXTENSION_FALLBACKS,
} from "./constants.js";
import { fileNameHandler } from "./file-name.js";

export function validateMediaMimeType(
  file,
  allowedTypes = DEFAULT_ALLOWED_MEDIA_TYPES
) {
  const allowed = allowedTypes.some((type) => file.type.startsWith(type));
  if (DANGEROUS_MIME_TYPES.includes(file.type)) {
    return false;
  }
  if (!file.type || file.type === "application/octet-stream") {
    const fileName = fileNameHandler(file);
    return MEDIA_EXTENSION_FALLBACKS.some((ext) => fileName.endsWith(ext));
  }
  return allowed;
}
