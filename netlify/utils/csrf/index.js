import {
  DEFAULT_COOKIE_NAME,
  DEFAULT_HEADER_NAME,
  ENV_CSRF_SECRET,
} from "./constants.js";
import { generateToken } from "./token-generator.js";
import { createCsrfCookieHeader, parseCookies } from "./cookie-helpers.js";
import { getTokenFromRequest } from "./request-tokens.js";
import { verifyDoubleSubmit } from "./validation.js";
import {
  createSignedToken,
  verifySignedToken,
  signWithEnv,
  verifyWithEnv,
} from "./signed-tokens.js";

export {
  DEFAULT_COOKIE_NAME,
  DEFAULT_HEADER_NAME,
  ENV_CSRF_SECRET,
  generateToken,
  createCsrfCookieHeader,
  parseCookies,
  getTokenFromRequest,
  verifyDoubleSubmit,
  createSignedToken,
  verifySignedToken,
  signWithEnv,
  verifyWithEnv,
};

const csrfModule = {
  DEFAULT_COOKIE_NAME,
  DEFAULT_HEADER_NAME,
  ENV_CSRF_SECRET,
  generateToken,
  createCsrfCookieHeader,
  parseCookies,
  getTokenFromRequest,
  verifyDoubleSubmit,
  createSignedToken,
  verifySignedToken,
  signWithEnv,
  verifyWithEnv,
};

export default csrfModule;
