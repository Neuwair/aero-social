export function setSecureCookie(name, value, options = {}) {
  const isProduction = process.env.NETLIFY_DEV !== "true";

  const opts = {
    path: options.path || "/",
    httpOnly: options.httpOnly !== false,
    secure: options.secure !== false && isProduction,
    sameSite: options.sameSite || "Strict",
    maxAge: options.maxAge,
    ...options,
  };

  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  if (opts.maxAge) cookie += `; Max-Age=${opts.maxAge}`;
  if (opts.path) cookie += `; Path=${opts.path}`;
  if (opts.httpOnly) cookie += `; HttpOnly`;
  if (opts.secure) cookie += `; Secure`;
  if (opts.sameSite) cookie += `; SameSite=${opts.sameSite}`;

  return cookie;
}
