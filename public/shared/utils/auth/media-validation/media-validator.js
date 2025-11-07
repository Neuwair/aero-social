import {
  DEFAULT_ALLOWED_MEDIA_TYPES,
  DEFAULT_MAX_FILE_SIZE,
} from "./constants.js";
import { validateFileSize, getFileSizeError } from "./file-size.js";
import { validateFileName, getFileNameError } from "./file-name.js";
import { validateExtensions } from "./extensions.js";
import { validateMimeType, getMimeTypeError } from "./mime-type.js";
import { validateFileType } from "./file-type.js";
import { validateMediaMimeType } from "./media-mime.js";
import { validateMediaMagicNumbers } from "./magic-numbers.js";

export function ValidateMediaFile(
  file,
  {
    allowedExtensions,
    dangerousExtensions,
    allowedTypes = DEFAULT_ALLOWED_MEDIA_TYPES,
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    strictMedia = false,
  } = {}
) {
  if (!validateFileSize(file, maxFileSize)) {
    return {
      isValid: false,
      reason: getFileSizeError(file, maxFileSize),
    };
  }
  if (!validateFileName(file)) {
    return {
      isValid: false,
      reason: getFileNameError(file),
    };
  }
  const extResult = validateExtensions(file, {
    allowedExtensions,
    dangerousExtensions,
  });
  if (!extResult.isValid) {
    return extResult;
  }
  if (strictMedia) {
    if (!validateMimeType(file, allowedTypes)) {
      return {
        isValid: false,
        reason: getMimeTypeError(file, allowedTypes),
      };
    }
    const fileTypeResult = validateFileType(file);
    if (!fileTypeResult.isValid) {
      return fileTypeResult;
    }
  } else {
    if (!validateMediaMimeType(file, allowedTypes)) {
      return {
        isValid: false,
        reason: `File type ${file.type} is not allowed.`,
      };
    }
    const fileTypeResult = validateFileType(file);
    if (!fileTypeResult.isValid) {
      return fileTypeResult;
    }
  }
  return validateMediaMagicNumbers(file);
}

export function validateImageFile(file, maxFileSize = DEFAULT_MAX_FILE_SIZE) {
  const imageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/webp",
  ];
  return ValidateMediaFile(file, {
    allowedTypes: imageTypes,
    maxFileSize,
    strictMedia: false,
  });
}

export function validateMediaFile(
  file,
  allowedTypes,
  maxFileSize = DEFAULT_MAX_FILE_SIZE
) {
  return ValidateMediaFile(file, {
    allowedTypes,
    maxFileSize,
    strictMedia: false,
  });
}

export default ValidateMediaFile;
