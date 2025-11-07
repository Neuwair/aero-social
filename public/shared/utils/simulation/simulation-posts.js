function startLikeSimulationForPost(postElement, timeElem) {
  if (!postElement || !timeElem) return;
  const TS = timeElem._timestamp || 0;
  const SIM_WINDOW_MS = 2 * 60 * 1000;
  const expiresAt = TS + SIM_WINDOW_MS;
  if (Date.now() > expiresAt) return;

  if (postElement._likeSim && postElement._likeSim.running) return;

  postElement._likeSim = postElement._likeSim || {};
  postElement._likeSim.running = true;
  postElement._likeSim.expiresAt = expiresAt;

  const heartCounter = postElement.querySelector(".heart-up-counter");
  if (!heartCounter) return;

  let baseCount = parseInt(heartCounter.textContent) || 0;
  postElement._likeSim.baseCount = baseCount;

  scheduleNextLikeIncrement(postElement);
}

function stopLikeSimulationForPost(postElement) {
  if (!postElement || !postElement._likeSim) return;
  postElement._likeSim.running = false;
  if (postElement._likeSim.timeoutId) {
    clearTimeout(postElement._likeSim.timeoutId);
    postElement._likeSim.timeoutId = null;
  }
}

function startNavSimulationForPost(postElement, timeElem) {
  if (!postElement || !timeElem) return;
  const TS = timeElem._timestamp || 0;
  const SIM_WINDOW_MS = 2 * 60 * 1000;
  const expiresAt = TS + SIM_WINDOW_MS;
  if (Date.now() > expiresAt) return;

  if (postElement._navSim && postElement._navSim.running) return;

  postElement._navSim = postElement._navSim || { timeouts: {} };
  postElement._navSim.running = true;
  postElement._navSim.expiresAt = expiresAt;

  const shareCounter = postElement.querySelector(".share-up-counter");
  const bookmarkCounter = postElement.querySelector(".bookmark-up-counter");
  postElement._navSim.base = {};
  postElement._navSim.base.share =
    parseInt(shareCounter ? shareCounter.textContent : "") || 0;
  postElement._navSim.base.bookmark =
    parseInt(bookmarkCounter ? bookmarkCounter.textContent : "") || 0;

  scheduleNextNavIncrement(postElement, "share");
  scheduleNextNavIncrement(postElement, "bookmark");
}

function stopNavSimulationForPost(postElement) {
  if (!postElement || !postElement._navSim) return;
  postElement._navSim.running = false;
  try {
    const t = postElement._navSim.timeouts || {};
    Object.values(t).forEach((id) => {
      try {
        if (id) clearTimeout(id);
      } catch (e) {}
    });
  } catch (e) {}
  postElement._navSim.timeouts = {};
}

function scheduleNextNavIncrement(postElement, type) {
  if (!postElement || !postElement._navSim || !postElement._navSim.running)
    return;
  const now = Date.now();
  const expiresAt = postElement._navSim.expiresAt || now;
  const remaining = Math.max(0, expiresAt - now);
  if (remaining <= 0) {
    postElement._navSim.running = false;
    return;
  }

  const maxDelay = Math.min(30000, remaining);
  const minDelay = 500;
  const delay =
    Math.floor(Math.random() * Math.max(minDelay, maxDelay - minDelay)) +
    minDelay;
  const tId = setTimeout(() => {
    try {
      performNavIncrement(postElement, type);
    } finally {
      if (postElement._navSim && postElement._navSim.running) {
        scheduleNextNavIncrement(postElement, type);
      }
    }
  }, delay);
  postElement._navSim.timeouts = postElement._navSim.timeouts || {};
  postElement._navSim.timeouts[type] = tId;
}

function performNavIncrement(postElement, type) {
  if (!postElement || !postElement._navSim) return;
  const now = Date.now();
  if (postElement._navSim.expiresAt && now > postElement._navSim.expiresAt) {
    postElement._navSim.running = false;
    return;
  }

  let counterEl = null;
  let btnEl = null;
  if (type === "share") {
    counterEl = postElement.querySelector(".share-up-counter");
    btnEl = counterEl ? counterEl.closest("button.nav-item-post") : null;
  } else if (type === "bookmark") {
    counterEl = postElement.querySelector(".bookmark-up-counter");
    btnEl = counterEl ? counterEl.closest("button.nav-item-post") : null;
  }
  if (!counterEl) return;

  const delta = Math.floor(Math.random() * 8) + 1;
  const current = parseInt(counterEl.textContent) || 0;
  counterEl.textContent = current + delta;

  if (btnEl) {
    btnEl.style.transform = "scale(1.15)";
    setTimeout(() => {
      try {
        btnEl.style.transform = "scale(1)";
      } catch (e) {}
    }, 300);
  }
  try {
    updatePostButtonAlignment(postElement);
  } catch (e) {}
}

function scheduleNextLikeIncrement(postElement) {
  if (!postElement || !postElement._likeSim || !postElement._likeSim.running)
    return;
  const now = Date.now();
  const expiresAt = postElement._likeSim.expiresAt || now;
  const remaining = Math.max(0, expiresAt - now);
  if (remaining <= 0) {
    postElement._likeSim.running = false;
    return;
  }

  const maxDelay = Math.min(30000, remaining);
  const minDelay = 500;
  const delay =
    Math.floor(Math.random() * Math.max(minDelay, maxDelay - minDelay)) +
    minDelay;
  const tId = setTimeout(() => {
    try {
      performLikeIncrement(postElement);
    } finally {
      if (postElement._likeSim && postElement._likeSim.running) {
        scheduleNextLikeIncrement(postElement);
      }
    }
  }, delay);
  postElement._likeSim.timeoutId = tId;
}

function performLikeIncrement(postElement) {
  if (!postElement) return;
  const heartCounter = postElement.querySelector(".heart-up-counter");
  const heartBtn = postElement.querySelector(".heartPostBtn");
  if (!heartCounter) return;
  const now = Date.now();
  if (
    postElement._likeSim &&
    postElement._likeSim.expiresAt &&
    now > postElement._likeSim.expiresAt
  ) {
    postElement._likeSim.running = false;
    return;
  }
  const delta = Math.floor(Math.random() * 8) + 1;
  const current = parseInt(heartCounter.textContent) || 0;
  const next = current + delta;
  heartCounter.textContent = next;

  if (heartBtn) {
    heartBtn.style.transform = "scale(1.15)";
    setTimeout(() => {
      if (heartBtn) heartBtn.style.transform = "scale(1)";
    }, 300);
  }
  try {
    updatePostButtonAlignment(postElement);
  } catch (e) {}
}

function updatePostButtonAlignment(postElement) {
  if (!postElement) return;
  const heartBtn = postElement.querySelector(".heartPostBtn");
  const heartCounter = postElement.querySelector(".heart-up-counter");
  if (heartBtn) {
    if (
      heartCounter &&
      heartCounter.textContent &&
      heartCounter.textContent.trim() !== ""
    ) {
      heartBtn.classList.add("has-count");
    } else {
      heartBtn.classList.remove("has-count");
    }
  }
  const navPostButtons = postElement.querySelectorAll("button.nav-item-post");
  const shareBtn =
    navPostButtons && navPostButtons.length > 0 ? navPostButtons[0] : null;
  const bookmarkBtn =
    navPostButtons && navPostButtons.length > 1 ? navPostButtons[1] : null;
  const shareCounter = postElement.querySelector(".share-up-counter");
  const bookmarkCounter = postElement.querySelector(".bookmark-up-counter");
  if (shareBtn) {
    if (
      shareCounter &&
      shareCounter.textContent &&
      shareCounter.textContent.trim() !== ""
    ) {
      shareBtn.classList.add("has-count");
    } else {
      shareBtn.classList.remove("has-count");
    }
  }
  if (bookmarkBtn) {
    if (
      bookmarkCounter &&
      bookmarkCounter.textContent &&
      bookmarkCounter.textContent.trim() !== ""
    ) {
      bookmarkBtn.classList.add("has-count");
    } else {
      bookmarkBtn.classList.remove("has-count");
    }
  }
}

export {
  startLikeSimulationForPost,
  stopLikeSimulationForPost,
  startNavSimulationForPost,
  stopNavSimulationForPost,
  scheduleNextNavIncrement,
  performNavIncrement,
  scheduleNextLikeIncrement,
  performLikeIncrement,
  updatePostButtonAlignment,
};
