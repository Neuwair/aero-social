import { friendRequestState } from "./state.js";
import { randomFromArray } from "./random-username.js";

export async function loadAvatarBaseNames() {
  if (!friendRequestState.manifestPromise) {
    friendRequestState.manifestPromise = fetch(
      "/shared/assets/assets-manifest.json",
      {
        cache: "no-cache",
      }
    )
      .then((res) => {
        if (!res.ok) {
          return { baseNames: [] };
        }
        return res.json();
      })
      .then((data) => {
        if (!data || !Array.isArray(data.baseNames)) {
          return [];
        }
        return data.baseNames.slice();
      })
      .catch(() => []);
  }
  return friendRequestState.manifestPromise;
}

export async function getAvatarPath() {
  const baseNames = await loadAvatarBaseNames();
  if (!baseNames.length) {
    return "#";
  }
  return `/shared/assets/avatar/${randomFromArray(baseNames)}.jpg`;
}
