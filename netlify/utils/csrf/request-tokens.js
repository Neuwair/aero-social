import { DEFAULT_COOKIE_NAME, DEFAULT_HEADER_NAME } from "./constants.js";
import { parseCookies } from "./cookie-helpers.js";
import { safeParseBody } from "./parse-body.js";

export function getTokenFromRequest(reqOrEvent, options = {}) {
  const {
    cookieName = DEFAULT_COOKIE_NAME,
    headerName = DEFAULT_HEADER_NAME,
    bodyField = "_csrf",
  } = options;

  const headers = (reqOrEvent && (reqOrEvent.headers || reqOrEvent)) || {};
  const cookieHeader = headers.cookie || headers.Cookie || null;
  const cookies = parseCookies(cookieHeader);
  const cookieToken = cookies[cookieName] || null;

  const lowerHeaderName = headerName.toLowerCase();
  const headerToken = headers[headerName] || headers[lowerHeaderName] || null;

  let bodyObj = null;
  if (reqOrEvent && reqOrEvent.body !== undefined) {
    bodyObj = safeParseBody(reqOrEvent.body);
  } else if (reqOrEvent && reqOrEvent.rawBody) {
    bodyObj = safeParseBody(reqOrEvent.rawBody);
  }
  const bodyToken =
    (bodyObj && (bodyObj[bodyField] || bodyObj.csrf || bodyObj._csrf)) || null;

  let queryToken = null;
  if (reqOrEvent && reqOrEvent.queryStringParameters) {
    queryToken = reqOrEvent.queryStringParameters[bodyField] || null;
  } else if (reqOrEvent && reqOrEvent.query) {
    queryToken = reqOrEvent.query[bodyField] || null;
  }

  return {
    cookieToken,
    headerToken,
    bodyToken,
    queryToken,
    providedToken: headerToken || bodyToken || queryToken || null,
  };
}
