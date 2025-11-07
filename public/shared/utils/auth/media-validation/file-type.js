import { fileNameHandler } from "./file-name.js";

export function validateFileType(file) {
  const fileName = fileNameHandler(file);
  if (file.type === "image/svg+xml" || fileName.endsWith(".svg")) {
    return {
      isValid: false,
      reason: "SVG files are not allowed for security reasons.",
    };
  }
  if (fileName.match(/\.(jpg|jpeg)$/) && !file.type.includes("jpeg")) {
    return {
      isValid: false,
      reason: "File appears to be disguised or corrupted.",
    };
  }
  if (fileName.endsWith(".png") && file.type !== "image/png") {
    return {
      isValid: false,
      reason: "File appears to be disguised or corrupted.",
    };
  }
  return { isValid: true };
}
