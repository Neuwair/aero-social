async function loadManifest() {
  try {
    const res = await fetch("/shared/assets/assets-manifest.json", {
      cache: "no-cache",
    });
    if (!res.ok) throw new Error("Manifest fetch failed");
    return await res.json();
  } catch (e) {
    console.warn("Could not load assets manifest", e);
    return { baseNames: [] };
  }
}

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

let _cachedDefaultPromise = null;

export async function getOrCreateDefaultPaths() {
  if (_cachedDefaultPromise) return _cachedDefaultPromise;

  _cachedDefaultPromise = (async () => {
    try {
      const assigned = localStorage.getItem("defaultAvatarAssigned");
      if (assigned) {
        return {
          avatarPath: localStorage.getItem("defaultAvatarPath") || null,
          bannerPath: localStorage.getItem("defaultBannerPath") || null,
          baseName: localStorage.getItem("defaultAvatarBase") || null,
        };
      }

      const manifest = await loadManifest();
      const baseNames = Array.isArray(manifest.baseNames)
        ? manifest.baseNames
        : [];
      if (!baseNames.length)
        return { avatarPath: null, bannerPath: null, baseName: null };

      const pick = randomFromArray(baseNames);
      const avatarPath = `/shared/assets/avatar/${pick}.jpg`;
      const bannerPath = `/shared/assets/banner/${pick}.jpg`;

      try {
        localStorage.setItem("defaultAvatarAssigned", "1");
        localStorage.setItem("defaultAvatarBase", pick);
        localStorage.setItem("defaultAvatarPath", avatarPath);
        localStorage.setItem("defaultBannerPath", bannerPath);
      } catch (e) {
        console.warn(
          "Failed to persist default avatar/banner to localStorage",
          e
        );
      }

      return { avatarPath, bannerPath, baseName: pick };
    } catch (e) {
      console.error("Error assigning default avatar/banner", e);
      return { avatarPath: null, bannerPath: null, baseName: null };
    }
  })();

  return _cachedDefaultPromise;
}

export function clearDefaultAssignment() {
  localStorage.removeItem("defaultAvatarAssigned");
  localStorage.removeItem("defaultAvatarBase");
  localStorage.removeItem("defaultAvatarPath");
  localStorage.removeItem("defaultBannerPath");
}
