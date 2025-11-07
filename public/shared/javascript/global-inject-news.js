function injectNews(selector, filePath) {
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
        try {
          document.dispatchEvent(
            new CustomEvent("newsInjected", { detail: { selector, filePath } })
          );
        } catch (e) {
          document.dispatchEvent(new Event("newsInjected"));
        }
        resolve();
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  injectNews("#injectNews", "/shared/components/global-inject-news.html");
});
