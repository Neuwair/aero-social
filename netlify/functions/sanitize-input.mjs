export function sanitizeString(str, options = {}) {
  if (typeof str !== "string") return "";
  let s = str.trim();
  if (options.maxLength) s = s.substring(0, options.maxLength);
  s = s.replace(/<[^>]*>/g, "");
  s = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  if (options.removeDangerous) {
    s = s.replace(/javascript:/gi, "").replace(/data:/gi, "");
  }
  if (options.asciiOnly) {
    s = s.replace(/[^	\n\r -~]/g, "");
  }
  return s;
}

export function sanitizeNumeric(value, options = {}) {
  const num = parseInt(value, 10);
  if (isNaN(num)) return null;
  if (options.min !== undefined && num < options.min) return options.min;
  if (options.max !== undefined && num > options.max) return options.max;
  return num;
}

export function sanitizeQueryParam(param, options = {}) {
  if (!param) return "";
  return sanitizeString(param, options);
}

export default {
  sanitizeString,
  sanitizeNumeric,
  sanitizeQueryParam,
};
