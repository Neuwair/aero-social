const DANGEROUS_FILE_PATTERNS = [
  /\0/,
  /\.\./,
  /[\/\\]/,
  /^\.+$/,
  /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i,
  /[\x00-\x1f\x7f]/,
  /[<>:"|?*]/,
  /\s$/,
];

export function fileNameHandler(file) {
  return file.name.toLowerCase();
}

export function validateFileName(file) {
  if (!file.name || file.name.trim() === "") {
    return false;
  }
  const cleanFileName = file.name.trim();
  if (DANGEROUS_FILE_PATTERNS.some((pattern) => pattern.test(cleanFileName))) {
    return false;
  }
  if (cleanFileName.length > 255) {
    return false;
  }
  return true;
}

export function getFileNameError(file) {
  if (!file.name || file.name.trim() === "") {
    return "File must have a valid name.";
  }
  const cleanFileName = file.name.trim();
  if (DANGEROUS_FILE_PATTERNS.some((pattern) => pattern.test(cleanFileName))) {
    return "File name contains invalid or dangerous characters.";
  }
  if (cleanFileName.length > 255) {
    return "File name is too long (maximum 255 characters).";
  }
  return "";
}
