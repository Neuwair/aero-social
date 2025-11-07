import { friendRequestState } from "./state.js";
import { SIM_WINDOW_MS, MIN_DELAY, MAX_DELAY } from "./constants.js";
import {
  setUiElements,
  ensureTimestampElement,
  enqueueRequest,
  dequeueCurrentRequest,
  clearCurrentDisplayImmediately,
  hideTemporarily,
  showNextRequest,
  updateFriendsCounter,
  initializeFriendsCounter,
  applyCounterAnimation,
  waitForUiElements,
  analyzePendingDuplicates,
} from "./ui-queue.js";
import {
  createRequest,
  persistSimulationState,
  removePendingOnServer,
  listPendingRequests,
  getSimulationState,
  addFriendOnServer,
} from "./server-service.js";
import { requestUserData } from "../../helper/fetch-user-data.js";

function remainingMs() {
  if (friendRequestState.stopAt && friendRequestState.stopAt > Date.now()) {
    return Math.max(0, friendRequestState.stopAt - Date.now());
  }
  return Math.max(0, SIM_WINDOW_MS - friendRequestState.activeElapsedMs);
}

function scheduleNext() {
  if (!friendRequestState.timerRunning) {
    return;
  }
  const remaining = remainingMs();
  if (remaining <= 0) {
    stopSimulationInternal();
    return;
  }
  const cappedMax = Math.min(MAX_DELAY, remaining);
  const delay =
    cappedMax <= MIN_DELAY
      ? cappedMax
      : Math.floor(Math.random() * (cappedMax - MIN_DELAY)) + MIN_DELAY;
  friendRequestState.scheduledId = setTimeout(async () => {
    friendRequestState.scheduledId = null;
    if (!friendRequestState.timerRunning) {
      return;
    }
    const request = await createRequest();
    enqueueRequest(request);
    pauseTimer();
  }, delay);
}

function resumeTimer() {
  if (remainingMs() <= 0) {
    stopSimulationInternal();
    return;
  }
  if (!friendRequestState.timerRunning) {
    friendRequestState.timerRunning = true;
    friendRequestState.timerLastStart = Date.now();
  }
  if (!friendRequestState.scheduledId) {
    scheduleNext();
  }
  if (friendRequestState.userKey) {
    persistSimulationState({
      userKey: friendRequestState.userKey,
      timerRunning: friendRequestState.timerRunning,
      activeElapsedMs: friendRequestState.activeElapsedMs,
      timerLastStart: friendRequestState.timerLastStart,
    }).catch(() => {});
  }
}

function pauseTimer() {
  if (friendRequestState.timerRunning) {
    friendRequestState.activeElapsedMs +=
      Date.now() - friendRequestState.timerLastStart;
    friendRequestState.timerRunning = false;
  }
  if (friendRequestState.scheduledId) {
    clearTimeout(friendRequestState.scheduledId);
    friendRequestState.scheduledId = null;
  }
  if (friendRequestState.userKey) {
    persistSimulationState({
      userKey: friendRequestState.userKey,
      timerRunning: friendRequestState.timerRunning,
      activeElapsedMs: friendRequestState.activeElapsedMs,
      timerLastStart: friendRequestState.timerLastStart,
    }).catch(() => {});
  }
}

function stopSimulationInternal() {
  pauseTimer();
  friendRequestState.simulationStarted = false;
}

async function startSimulationInternal() {
  if (friendRequestState.simulationStarted || !friendRequestState.ui) {
    return;
  }
  friendRequestState.simulationStarted = true;
  friendRequestState.pendingQueue = [];
  friendRequestState.activeElapsedMs = 0;
  friendRequestState.timerRunning = true;
  if (!friendRequestState.stopAt || Date.now() >= friendRequestState.stopAt) {
    friendRequestState.stopAt = Date.now() + SIM_WINDOW_MS;
  }
  friendRequestState.timerLastStart = Date.now();
  const request = await createRequest();
  enqueueRequest(request);
  pauseTimer();
  resumeTimer();
  if (friendRequestState.userKey) {
    persistSimulationState({
      userKey: friendRequestState.userKey,
      timerRunning: friendRequestState.timerRunning,
      activeElapsedMs: friendRequestState.activeElapsedMs,
      timerLastStart: friendRequestState.timerLastStart,
    }).catch(() => {});
  }
}

function markSimulationRun(uid) {
  if (!uid) {
    return;
  }
  try {
    localStorage.setItem(
      `friendRequestsSimulatedFor:${uid}`,
      Date.now().toString()
    );
  } catch (e) {}
}

function hasSimulationRun(uid) {
  if (!uid) {
    return false;
  }
  try {
    return Boolean(localStorage.getItem(`friendRequestsSimulatedFor:${uid}`));
  } catch (e) {
    return false;
  }
}

function applyServerState(rawState) {
  if (!rawState) {
    return false;
  }
  const storedActive = Number(
    rawState.active_elapsed_ms ?? rawState.activeElapsedMs ?? 0
  );
  const storedRunning = Boolean(
    rawState.running ?? rawState.is_running ?? false
  );
  const stopSource = rawState.stop_at ?? rawState.stopAt ?? null;
  const lastSource = rawState.last_started_at || rawState.lastStartedAt || null;
  friendRequestState.activeElapsedMs = Number.isFinite(storedActive)
    ? storedActive
    : 0;
  friendRequestState.timerRunning = false;
  friendRequestState.timerLastStart = 0;
  friendRequestState.stopAt = 0;
  const hasQueue = friendRequestState.pendingQueue.length > 0;
  friendRequestState.simulationStarted =
    hasQueue || friendRequestState.activeElapsedMs > 0 || storedRunning;
  if (stopSource) {
    const parsed = Date.parse(stopSource);
    if (!Number.isNaN(parsed)) {
      friendRequestState.stopAt = parsed;
    }
  } else if (storedRunning && lastSource) {
    const parsed = new Date(lastSource).getTime();
    if (!Number.isNaN(parsed)) {
      friendRequestState.activeElapsedMs += Math.max(0, Date.now() - parsed);
      friendRequestState.stopAt = parsed + SIM_WINDOW_MS;
    }
  } else if (friendRequestState.activeElapsedMs > 0) {
    friendRequestState.stopAt =
      Date.now() +
      Math.max(0, SIM_WINDOW_MS - friendRequestState.activeElapsedMs);
  }
  if (remainingMs() <= 0) {
    stopSimulationInternal();
    friendRequestState.stopAt = 0;
    return false;
  }
  if (storedRunning && friendRequestState.simulationStarted) {
    resumeTimer();
  }
  return friendRequestState.simulationStarted;
}

export async function handleAccept() {
  const removed = dequeueCurrentRequest();
  if (!removed) {
    return;
  }
  clearCurrentDisplayImmediately();
  hideTemporarily(removed);
  resumeTimer();
  const persisted = await addFriendOnServer({
    username: removed.username,
    avatar: removed.avatar,
  });
  if (persisted) {
    friendRequestState.friendsCount += 1;
    updateFriendsCounter();
    applyCounterAnimation();
  }
  if (removed.persisted) {
    await removePendingOnServer(removed.id);
  }
  analyzePendingDuplicates(removed);
}

export function handleReject() {
  const removed = dequeueCurrentRequest();
  if (!removed) {
    return;
  }
  clearCurrentDisplayImmediately();
  hideTemporarily(removed);
  resumeTimer();
  if (removed.persisted) {
    removePendingOnServer(removed.id);
  }
  analyzePendingDuplicates(removed);
}

async function checkAccountAndMaybeStart() {
  try {
    const { secureAPI } = await import("../../api/api-csrf.js");
    const csrfToken = await secureAPI.getCsrfToken();
    const response = await requestUserData({ uid: null, csrfToken });
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    const uid = data && (data.uid || data.username);
    friendRequestState.userKey = uid || null;
    const pending = await listPendingRequests();
    pending.forEach((r) => enqueueRequest(r));
    showNextRequest();
    let stateApplied = false;
    const state = await getSimulationState();
    if (state) {
      stateApplied = applyServerState(state);
      if (stateApplied && uid) {
        markSimulationRun(uid);
      }
    }
    if (!stateApplied && !hasSimulationRun(uid)) {
      await startSimulationInternal();
      markSimulationRun(uid);
    }
  } catch (e) {}
}

export async function initialize() {
  if (friendRequestState.initialized) {
    return;
  }
  let ui;
  try {
    ui = await waitForUiElements();
  } catch (e) {
    return;
  }
  friendRequestState.initialized = true;
  setUiElements(ui);
  ensureTimestampElement();
  ui.acceptBtn.addEventListener("click", handleAccept);
  ui.cancelBtn.addEventListener("click", handleReject);
  initializeFriendsCounter();
  checkAccountAndMaybeStart();
}

export function stopFriendRequestSimulation() {
  stopSimulationInternal();
}

export function startFriendRequestSimulation() {
  startSimulationInternal();
}

export const stopSimulation = stopFriendRequestSimulation;
export const startSimulation = startFriendRequestSimulation;
