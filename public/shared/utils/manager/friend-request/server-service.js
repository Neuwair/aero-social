import { generateRandomUsername } from "./random-username.js";
import { getAvatarPath } from "./avatar-service.js";

export async function createRequest() {
  const username = generateRandomUsername();
  const avatar = await getAvatarPath();
  try {
    const res = await fetch("/.netlify/functions/api-addPendingRequest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        requester_username: username,
        requester_avatar: avatar,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.pending && data.pending.id) {
        return { id: data.pending.id, username, avatar, persisted: true };
      }
    }
  } catch (e) {
    console.warn(
      "Could not persist pending request, using local-only request",
      e
    );
  }
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    username,
    avatar,
    persisted: false,
  };
}

export async function persistSimulationState({
  userKey,
  timerRunning,
  activeElapsedMs,
  timerLastStart,
}) {
  if (!userKey) {
    return;
  }
  try {
    await fetch("/.netlify/functions/api-setSimulationState", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        running: timerRunning,
        activeElapsedMs,
        lastStartedAt: timerLastStart || null,
      }),
    });
  } catch (e) {}
}

export async function removePendingOnServer(id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return;
  }
  try {
    await fetch("/.netlify/functions/api-removePendingRequest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ id: numericId }),
    });
  } catch (e) {}
}

export async function listPendingRequests() {
  try {
    const res = await fetch("/.netlify/functions/api-listPendingRequests", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.pending)) {
      return [];
    }
    return data.pending.map((r) => ({
      id: r.id,
      username: r.requester_username,
      avatar: r.requester_avatar,
      persisted: true,
    }));
  } catch (e) {
    return [];
  }
}

export async function getSimulationState() {
  try {
    const res = await fetch("/.netlify/functions/api-getSimulationState", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    if (!data || !data.state) {
      return null;
    }
    return data.state;
  } catch (e) {
    return null;
  }
}

export async function addFriendOnServer({ username, avatar }) {
  try {
    const res = await fetch("/.netlify/functions/api-addFriend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        friend_username: username,
        friend_avatar: avatar,
      }),
    });
    if (res && res.ok) {
      return true;
    }
    console.warn(
      "Failed to persist accepted friend, server returned:",
      res && res.status
    );
    return false;
  } catch (e) {
    console.warn("Failed to persist accepted friend:", e);
    return false;
  }
}
