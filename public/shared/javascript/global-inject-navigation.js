function injectNavigationContainer(selector, filePath) {
  return new Promise((resolve, reject) => {
    const container = document.querySelector(selector);
    if (!container) {
      console.error(`Container not found for selector: ${selector}`);
      reject(`No container for selector: ${selector}`);
      return;
    }

    fetch(filePath)
      .then((res) => {
        if (!res.ok)
          throw new Error(`Failed to load ${filePath}: ${res.status}`);
        return res.text();
      })
      .then((html) => {
        container.innerHTML = html;
        document.dispatchEvent(
          new CustomEvent("navigation:ready", {
            detail: { selector, filePath },
          })
        );
        resolve();
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  injectNavigationContainer(
    "#injectNavigationContainer",
    "/shared/components/global-inject-navigation.html"
  )
    .then(() => {
      try {
        if (
          window.location.pathname.includes("explore.html") ||
          window.location.pathname.includes("news.html")
        ) {
          const alertEl = document.querySelector(".navigation-alert-display");
          if (alertEl) {
            alertEl.classList.remove("bouncy-in");
            void alertEl.offsetWidth;
            alertEl.classList.add("bouncy-in");
            alertEl.addEventListener("animationend", function onEnd() {
              alertEl.classList.remove("bouncy-in");
              alertEl.removeEventListener("animationend", onEnd);
            });
          }
        }
      } catch (e) {
        console.error("Navigation alert animation error:", e);
      }
    })
    .catch((err) => {
      console.error("Navigation injection failed:", err);
    });
});
