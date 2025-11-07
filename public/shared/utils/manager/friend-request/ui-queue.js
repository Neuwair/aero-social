import { friendRequestState } from "./state.js";
import { timeObserver } from "../../performance/time-observer.js";
import { HIDDEN_COOLDOWN_MS } from "./constants.js";

export function setUiElements(elements) {
  friendRequestState.ui = elements;
}

export function getUiElements() {
  return friendRequestState.ui;
}

export function ensureTimestampElement() {
  if (!friendRequestState.ui) {
    return null;
  }
  if (friendRequestState.timestampEl) {
    return friendRequestState.timestampEl;
  }
  const el = document.createElement("span");
  el.style.display = "none";
  friendRequestState.ui.alertDisplay.appendChild(el);
  friendRequestState.timestampEl = el;
  return el;
}

export function setAlertVisibility(show) {
  if (!friendRequestState.ui) {
    return;
  }
  friendRequestState.ui.alertDisplay.style.display = show ? "flex" : "none";
}

export function updateFriendsCounter() {
  if (!friendRequestState.ui) {
    return;
  }
  friendRequestState.ui.counterEl.textContent = `Friends: ${friendRequestState.friendsCount}`;
}

export function showNextRequest() {
  if (!friendRequestState.ui) {
    return;
  }
  if (!friendRequestState.pendingQueue.length) {
    friendRequestState.ui.usernameEl.textContent = "";
    delete friendRequestState.ui.usernameEl.dataset.requestId;
    friendRequestState.ui.avatarEl.src = "#";
    setAlertVisibility(false);
    if (friendRequestState.timestampEl) {
      timeObserver.unobserve(friendRequestState.timestampEl);
    }
    return;
  }
  const next = friendRequestState.pendingQueue[0];
  friendRequestState.ui.usernameEl.textContent = next.username;
  friendRequestState.ui.usernameEl.dataset.requestId = next.id;
  friendRequestState.ui.avatarEl.src = next.avatar;
  if (friendRequestState.timestampEl) {
    friendRequestState.timestampEl._timestamp = Date.now();
    timeObserver.observe(friendRequestState.timestampEl);
  }
  setAlertVisibility(true);
}

export function enqueueRequest(request) {
  const key = request.id || request.username;
  const hiddenAt = friendRequestState.recentlyHidden.get(key);
  if (hiddenAt) {
    if (Date.now() - hiddenAt < HIDDEN_COOLDOWN_MS) {
      return;
    }
    friendRequestState.recentlyHidden.delete(key);
  }
  if (
    friendRequestState.pendingQueue.some((r) => r.username === request.username)
  ) {
    return;
  }
  friendRequestState.pendingQueue.push(request);
  if (friendRequestState.pendingQueue.length === 1) {
    showNextRequest();
  }
}

export function dequeueCurrentRequest() {
  if (!friendRequestState.pendingQueue.length) {
    return null;
  }
  const removed = friendRequestState.pendingQueue.shift();
  if (friendRequestState.pendingQueue.length) {
    showNextRequest();
  } else {
    setAlertVisibility(false);
    if (friendRequestState.timestampEl) {
      timeObserver.unobserve(friendRequestState.timestampEl);
    }
  }
  return removed;
}

export function clearCurrentDisplayImmediately() {
  try {
    if (!friendRequestState.ui) {
      const usernameEl = document.getElementById("usernameRequestStorage");
      const avatarEl = document.getElementById("userRequestAvatar");
      const alertDisplay = document.querySelector(
        ".navigation-request-alert-display"
      );
      if (usernameEl) {
        usernameEl.textContent = "";
        delete usernameEl.dataset.requestId;
      }
      if (avatarEl) {
        avatarEl.src = "#";
      }
      if (alertDisplay) {
        alertDisplay.style.display = "none";
      }
      if (friendRequestState.timestampEl) {
        timeObserver.unobserve(friendRequestState.timestampEl);
      }
      return;
    }
    friendRequestState.ui.usernameEl.textContent = "";
    delete friendRequestState.ui.usernameEl.dataset.requestId;
    friendRequestState.ui.avatarEl.src = "#";
    friendRequestState.ui.alertDisplay.style.display = "none";
    if (friendRequestState.timestampEl) {
      timeObserver.unobserve(friendRequestState.timestampEl);
    }
  } catch (e) {}
}

export function hideTemporarily(request) {
  try {
    const key = (request && (request.id || request.username)) || null;
    if (!key) {
      return;
    }
    friendRequestState.recentlyHidden.set(key, Date.now());
    if (request.username) {
      friendRequestState.recentlyHidden.set(request.username, Date.now());
    }
    setTimeout(() => {
      try {
        friendRequestState.recentlyHidden.delete(key);
        if (request.username) {
          friendRequestState.recentlyHidden.delete(request.username);
        }
      } catch (err) {}
    }, HIDDEN_COOLDOWN_MS + 1000);
  } catch (err) {}
}

export function analyzePendingDuplicates(removed) {
  const before = friendRequestState.pendingQueue.length;
  friendRequestState.pendingQueue = friendRequestState.pendingQueue.filter(
    (p) => p.username !== removed.username
  );
  if (friendRequestState.pendingQueue.length !== before) {
    showNextRequest();
  }
}

export async function initializeFriendsCounter() {
  if (!friendRequestState.ui) {
    return;
  }
  try {
    const res = await fetch("/.netlify/functions/api-getFriendsCount", {
      method: "GET",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      friendRequestState.friendsCount =
        data && typeof data.count === "number" ? data.count : 0;
      updateFriendsCounter();
      return;
    }
  } catch (e) {}
  const text = friendRequestState.ui.counterEl.textContent || "";
  const match = text.match(/Friends:\s*(\d+)/);
  friendRequestState.friendsCount = match ? parseInt(match[1], 10) : 0;
  updateFriendsCounter();
}

export function applyCounterAnimation() {
  const el =
    friendRequestState.ui && friendRequestState.ui.counterEl
      ? friendRequestState.ui.counterEl
      : document.getElementById("friendsCounter");
  if (!el) {
    return;
  }
  el.classList.remove("bouncy-in");
  void el.offsetWidth;
  el.classList.add("bouncy-in");
  const onEnd = () => {
    try {
      el.classList.remove("bouncy-in");
    } catch (err) {}
    el.removeEventListener("animationend", onEnd);
  };
  el.addEventListener("animationend", onEnd);
}

export function waitForUiElements(maxAttempts = 20, interval = 120) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      const usernameEl = document.getElementById("usernameRequestStorage");
      const avatarEl = document.getElementById("userRequestAvatar");
      const acceptBtn = document.getElementById("buttonAcceptRequest");
      const cancelBtn = document.getElementById("buttonCancelRequest");
      const counterEl = document.getElementById("friendsCounter");
      const alertDisplay = document.querySelector(
        ".navigation-request-alert-display"
      );
      if (
        usernameEl &&
        avatarEl &&
        acceptBtn &&
        cancelBtn &&
        alertDisplay &&
        counterEl
      ) {
        resolve({
          usernameEl,
          avatarEl,
          acceptBtn,
          cancelBtn,
          counterEl,
          alertDisplay,
        });
        return;
      }
      attempts += 1;
      if (attempts >= maxAttempts) {
        reject(new Error("Friend request UI not available"));
      } else {
        setTimeout(check, interval);
      }
    };
    check();
  });
}
