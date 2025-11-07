const REDIRECT_DELAY_MS = 11 * 60 * 1000;
const REDIRECT_KEY = "explore_redirect_start";

let redirectTimerId = null;
let visibilityListenerAttached = false;

function saveTimestamp() {
  try {
    window.sessionStorage.setItem(REDIRECT_KEY, String(Date.now()));
  } catch (err) {}
}

function clearTimestamp() {
  try {
    window.sessionStorage.removeItem(REDIRECT_KEY);
  } catch (err) {}
}

function clearRedirectTimer() {
  if (redirectTimerId !== null) {
    clearTimeout(redirectTimerId);
    redirectTimerId = null;
  }
}

function stopTimerInternal() {
  clearRedirectTimer();
  clearTimestamp();
}

function scheduleRedirect() {
  redirectTimerId = window.setTimeout(() => {
    stopTimerInternal();
    window.location.href = "/index.html";
  }, REDIRECT_DELAY_MS);
}

function handleVisibilityChange() {
  if (document.visibilityState === "hidden") {
    stopTimerInternal();
    return;
  }
  if (redirectTimerId === null) {
    saveTimestamp();
    scheduleRedirect();
  }
}

function startExploreRedirectionTimer() {
  stopTimerInternal();
  saveTimestamp();
  scheduleRedirect();

  if (!visibilityListenerAttached) {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", stopExploreRedirectionTimer, {
      once: true,
    });
    visibilityListenerAttached = true;
  }
}

function stopExploreRedirectionTimer() {
  stopTimerInternal();
  if (visibilityListenerAttached) {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    visibilityListenerAttached = false;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      startExploreRedirectionTimer();
    }
  });
}

export { startExploreRedirectionTimer, stopExploreRedirectionTimer };
