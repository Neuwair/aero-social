import { getCsrfFromCookie as readCsrfFromCookie } from "../manager/manager-cookies.js";

let csrfInitialized = false;

async function initializeCsrfProtection() {
  if (csrfInitialized) {
    return true;
  }

  try {
    const existingToken = getCsrfTokenFromCookie();

    if (!existingToken || isTokenExpired(existingToken)) {
      const response = await fetch("/.netlify/functions/csrf-getToken", {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        console.warn("Failed to initialize CSRF protection:", response.status);
        return false;
      }

      const data = await response.json();
    }

    csrfInitialized = true;
    return true;
  } catch (error) {
    console.error("Error initializing CSRF protection:", error);
    return false;
  }
}

function getCsrfTokenFromCookie() {
  return readCsrfFromCookie();
}

function isTokenExpired(token) {
  if (!token || typeof token !== "string") return true;

  if (!token.includes(".")) return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 2) return true;

    const [bodyB64] = parts;

    let bodyStr = bodyB64.replace(/-/g, "+").replace(/_/g, "/");
    while (bodyStr.length % 4) bodyStr += "=";

    const bodyJson = atob(bodyStr);
    const body = JSON.parse(bodyJson);

    if (!body.exp) return false;

    const now = Math.floor(Date.now() / 1000);
    return now > body.exp;
  } catch (e) {
    return true;
  }
}

async function refreshCsrfToken() {
  csrfInitialized = false;
  return await initializeCsrfProtection();
}

function autoInitializeCsrf() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeCsrfProtection);
  } else {
    initializeCsrfProtection();
  }
}

if (typeof window !== "undefined") {
  const needsCsrf =
    window.location.pathname.includes("/home/") ||
    window.location.pathname.includes("/explore/") ||
    window.location.pathname === "/" ||
    document.querySelector("form") !== null;

  if (needsCsrf) {
    autoInitializeCsrf();
  }
}

export {
  initializeCsrfProtection,
  getCsrfTokenFromCookie,
  refreshCsrfToken,
  autoInitializeCsrf,
};
