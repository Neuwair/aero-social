import { timeObserver } from "../performance/time-observer.js";
import { getSessionFromCookie } from "../manager/manager-cookies.js";

const MIN_DELAY = 800;
const MAX_DELAY = 12000;
const SIM_DURATION_MS = 2 * 60 * 1000;

async function waitForCounter(maxAttempts = 20, interval = 150) {
  let attempts = 0;
  return new Promise((resolve, reject) => {
    const check = () => {
      const el = document.getElementById("followersCounter");
      if (el) return resolve(el);
      attempts += 1;
      if (attempts >= maxAttempts)
        return reject(new Error("followersCounter not found"));
      setTimeout(check, interval);
    };
    check();
  });
}

async function fetchFollowersCount() {
  try {
    const res = await fetch("/.netlify/functions/api-getFollowersCount", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) {
      return 0;
    }
    const j = await res.json();

    return j && typeof j.count === "number" ? j.count : 0;
  } catch (e) {
    return 0;
  }
}

async function persistFollowerOnServer(username, avatar) {
  try {
    const res = await fetch("/.netlify/functions/api-addFollower", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        follower_username: username,
        follower_avatar: avatar,
      }),
    });
    if (!res.ok) {
      return null;
    }
    const j = await res.json();

    return j && j.follower ? j.follower : null;
  } catch (e) {
    return null;
  }
}

async function fetchSimulationStateFromServer() {
  try {
    const res = await fetch(
      "/.netlify/functions/api-getFollowersSimulationState",
      {
        method: "GET",
        credentials: "include",
      }
    );
    if (!res.ok) return null;
    const j = await res.json();
    return j && j.state ? j.state : null;
  } catch (e) {
    return null;
  }
}

async function persistSimulationStateToServer({
  activeElapsedMs = 0,
  stopAt = null,
  running = false,
} = {}) {
  try {
    await fetch("/.netlify/functions/api-setFollowersSimulationState", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeElapsedMs, stopAt, running }),
    });
  } catch (e) {}
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function animateCounterEl(el) {
  try {
    el.classList.remove("bouncy-in");
    void el.offsetWidth;
    el.classList.add("bouncy-in");
    const onEnd = () => {
      try {
        el.classList.remove("bouncy-in");
      } catch (e) {}
      el.removeEventListener("animationend", onEnd);
    };
    el.addEventListener("animationend", onEnd);
  } catch (e) {}
}

export async function initializeFollowersSimulation() {
  let counterEl;
  try {
    counterEl = await waitForCounter();
  } catch (e) {
    return;
  }

  function setCounterText(n) {
    counterEl.textContent = `Followers: ${n}`;
  }

  function setCounterTextAbsolute(n) {
    counterEl.textContent = `Followers: ${n}`;
  }

  function addToCounter(delta) {
    try {
      const txt = (counterEl.textContent || "").toString();
      const m = txt.match(/(\d+)/);
      const displayed = m ? parseInt(m[1], 10) : 0;
      const updated = displayed + Number(delta || 0);
      currentCount = updated;
      counterEl.textContent = `Followers: ${updated}`;
      return updated;
    } catch (e) {
      currentCount = (Number(delta) || 0) + (currentCount || 0);
      setCounterTextAbsolute(currentCount);
      return currentCount;
    }
  }

  let currentCount = await fetchFollowersCount();
  setCounterTextAbsolute(currentCount);

  let running = false;
  let stopAt = 0;
  let scheduled = null;

  try {
    const serverState = await fetchSimulationStateFromServer();
    if (serverState) {
      const stop = serverState.stop_at ?? serverState.stopAt ?? null;
      if (stop) {
        const parsed = Date.parse(stop);
        if (!Number.isNaN(parsed)) {
          stopAt = parsed;
        }
      } else {
        const last =
          serverState.last_started_at || serverState.lastStartedAt || null;
        if (last) {
          const parsed = Date.parse(last);
          if (!Number.isNaN(parsed)) {
            stopAt = parsed + SIM_DURATION_MS;
          }
        }
      }
      if (stopAt && Date.now() < stopAt && shouldRun()) {
        startSimulation();
      }
    }
  } catch (e) {}

  function shouldRun() {
    if (typeof document === "undefined") return false;
    if (document.visibilityState === "hidden") return false;
    const path = window.location.pathname || "";
    if (path.includes("/pages/news/")) return false;
    return true;
  }

  async function persistMultipleFollowers(count) {
    let successes = 0;
    for (let i = 0; i < count; i++) {
      const followerUsername = `user${Date.now().toString(36).slice(-6)}${i}`;
      const followerAvatar = "#";
      try {
        const res = await persistFollowerOnServer(
          followerUsername,
          followerAvatar
        );
        if (res) successes += 1;
      } catch (e) {
        break;
      }
    }
    return successes;
  }

  function scheduleNext() {
    if (!running) return;
    const delay = randomBetween(MIN_DELAY, MAX_DELAY);
    scheduled = setTimeout(async () => {
      scheduled = null;
      if (!running) return;
      if (Date.now() >= stopAt) {
        running = false;
        try {
          await persistSimulationStateToServer({
            activeElapsedMs: SIM_DURATION_MS,
            stopAt: null,
            running: false,
          });
        } catch (e) {}
        return;
      }
      if (!shouldRun()) {
        scheduleNext();
        return;
      }

      const inc = randomBetween(1, 5);
      const successes = await persistMultipleFollowers(inc);
      if (successes > 0) {
        addToCounter(successes);
        animateCounterEl(counterEl);
      }

      if (Date.now() < stopAt) {
        scheduleNext();
      } else {
        running = false;
        try {
          await persistSimulationStateToServer({
            activeElapsedMs: SIM_DURATION_MS,
            stopAt: null,
            running: false,
          });
        } catch (e) {}
      }
    }, delay);
  }

  function startSimulation() {
    if (running) return;
    running = true;
    if (!stopAt || Date.now() >= stopAt) {
      stopAt = Date.now() + SIM_DURATION_MS;
    }
    (async () => {
      try {
        await persistSimulationStateToServer({
          activeElapsedMs: 0,
          stopAt: new Date(stopAt).toISOString(),
          running: true,
        });
      } catch (e) {}
    })();
    scheduleNext();
  }

  function stopSimulation() {
    running = false;
    if (scheduled) {
      clearTimeout(scheduled);
      scheduled = null;
    }
    try {
      const startTime = stopAt ? stopAt - SIM_DURATION_MS : Date.now();
      const elapsed = Math.min(
        SIM_DURATION_MS,
        Math.max(0, Date.now() - startTime)
      );
      persistSimulationStateToServer({
        activeElapsedMs: elapsed,
        stopAt: null,
        running: false,
      }).catch(() => {});
    } catch (e) {}
  }

  document.addEventListener("visibilitychange", () => {
    if (shouldRun()) {
      if (!running && Date.now() < stopAt) startSimulation();
    } else {
      stopSimulation();
    }
  });

  window.addEventListener("popstate", () => {
    if (shouldRun()) {
      if (!running && Date.now() < stopAt) startSimulation();
    } else {
      stopSimulation();
    }
  });

  async function startIfAuthenticated() {
    try {
      const hasSession = Boolean(getSessionFromCookie());
      let lsUid = null;
      try {
        lsUid = localStorage.getItem("userUid");
      } catch (e) {
        lsUid = null;
      }
      const hasAuthUser = !!(
        window &&
        window.auth &&
        typeof window.auth.getCurrentUser === "function" &&
        window.auth.getCurrentUser()
      );
      try {
        const serverState = await fetchSimulationStateFromServer();
        if (serverState) {
          const stop = serverState.stop_at ?? serverState.stopAt ?? null;
          if (stop) {
            const parsed = Date.parse(stop);
            if (!Number.isNaN(parsed)) {
              stopAt = parsed;
            }
          } else {
            const last =
              serverState.last_started_at || serverState.lastStartedAt || null;
            if (last) {
              const parsed = Date.parse(last);
              if (!Number.isNaN(parsed)) {
                stopAt = parsed + SIM_DURATION_MS;
              }
            }
          }
          if (stopAt && Date.now() < stopAt && shouldRun()) {
            startSimulation();
            return;
          }
        }
      } catch (e) {}

      if ((hasSession || lsUid || hasAuthUser) && shouldRun()) {
        startSimulation();
      }
    } catch (e) {}
  }

  return {
    start: startSimulation,
    stop: stopSimulation,
    startIfAuthenticated,
    getCount: () => currentCount,
  };
}

export default initializeFollowersSimulation;
