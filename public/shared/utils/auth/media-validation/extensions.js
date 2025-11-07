import {
  DEFAULT_ALLOWED_EXTENSIONS,
  DEFAULT_DANGEROUS_EXTENSIONS,
} from "./constants.js";
import { fileNameHandler } from "./file-name.js";

export function validateExtensions(
  file,
  {
    allowedExtensions = DEFAULT_ALLOWED_EXTENSIONS,
    dangerousExtensions = DEFAULT_DANGEROUS_EXTENSIONS,
  } = {}
) {
  const fileName = fileNameHandler(file);
  if (dangerousExtensions.some((ext) => fileName.endsWith(ext))) {
    return {
      isValid: false,
      reason: "File type not allowed.",
    };
  }
  const extensionCount = (fileName.match(/\./g) || []).length;
  if (extensionCount > 1) {
    return {
      isValid: false,
      reason: "Files with multiple extensions are not allowed.",
    };
  }
  if (!allowedExtensions.some((ext) => fileName.endsWith(ext))) {
    return {
      isValid: false,
      reason: `File extension not allowed. Allowed: ${allowedExtensions.join(
        ", "
      )}`,
    };
  }
  return { isValid: true };
}
