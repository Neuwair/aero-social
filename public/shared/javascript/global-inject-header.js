import { initDropdownMenu } from "../utils/animations/dropdown-manager.js";
import {
  removeSessionCookie,
  removeCsrfCookie,
} from "../utils/manager/manager-cookies.js";
import { signOut } from "../utils/connections/sign-out.js";
import auth from "../utils/auth/auth-client.js";
import { initGlobalButtonBounce } from "./global-button-bounce.js";

if (typeof window !== "undefined" && window.location.protocol === "http:") {
  const host = window.location.host;
  if (!/^(localhost|127\.|0\.0\.0\.0)/.test(host)) {
    window.location.href = window.location.href.replace("http:", "https:");
  }
}
initGlobalButtonBounce();
function injectHeader(selector, filePath) {
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
        resolve();
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  injectHeader(
    "#injectHeaderContainer",
    "/shared/components/global-inject-header.html"
  ).then(() => {
    const pathname = window.location.pathname || "";

    const pathnameNormalized =
      (pathname || "").replace(/\s+$/g, "").replace(/\/+$/g, "") || "/";

    const matchesPath = (target) =>
      pathname === target ||
      pathname.endsWith(target) ||
      pathnameNormalized === target ||
      pathnameNormalized.endsWith(target);

    const pageAttr =
      document.body && document.body.dataset && document.body.dataset.page
        ? String(document.body.dataset.page).trim().toLowerCase()
        : null;

    let isIndex = false;
    let isReadme = false;
    let isExplore = false;
    let isNews = false;

    if (pageAttr) {
      isIndex = pageAttr === "index" || pageAttr === "home";
      isReadme = pageAttr === "readme";
      isExplore = pageAttr === "explore";
      isNews = pageAttr === "news";
    } else {
      isIndex =
        pathname === "/" ||
        pathname === "" ||
        pathnameNormalized === "/index.html" ||
        pathname === "/index.html";

      isReadme =
        /(^|\/)pages\/readme(\/|$)/.test(pathnameNormalized) ||
        /(^|\/)readme(\.html)?(\/|$)/.test(pathnameNormalized);

      isExplore =
        /(^|\/)pages\/explore(\/|$)/.test(pathnameNormalized) ||
        /(^|\/)explore(\.html)?(\/|$)/.test(pathnameNormalized);

      isNews =
        /(^|\/)pages\/news(\/|$)/.test(pathnameNormalized) ||
        /(^|\/)news(\.html)?(\/|$)/.test(pathnameNormalized);
    }

    const setElementsVisibility = (elements, visible) => {
      elements.forEach((button) => {
        const wrapper = button.closest(".item-reflection");
        try {
          button.hidden = !visible;
          if (visible) button.style.removeProperty("display");
          else button.style.display = "none";

          if (wrapper) {
            wrapper.hidden = !visible;
            if (visible) wrapper.style.removeProperty("display");
            else wrapper.style.display = "none";
          }
        } catch (err) {
          console.warn("Failed to toggle visibility for element:", err);
        }
      });
    };

    const ids = {
      home: ["homeBtn", "homeBtnDropdown"],
      explore: ["exploreBtn", "exploreBtnDropdown"],
      news: ["newsBtn", "newsBtnDropdown"],
      readme: ["readmeBtn", "readmeBtnDropdown"],
      logout: ["logoutBtn", "logoutBtnDropdown"],
    };

    const getEls = (arr) =>
      arr.map((id) => document.getElementById(id)).filter(Boolean);

    Object.values(ids).forEach((list) =>
      setElementsVisibility(getEls(list), false)
    );

    if (isReadme) {
      const homeButtons = getEls(ids.home);
      setElementsVisibility(homeButtons, true);
      setElementsVisibility(getEls(ids.readme), false);
      homeButtons.forEach((btn) => {
        try {
          if (btn.tagName === "A") btn.setAttribute("href", "/index.html");
          else
            btn.addEventListener("click", (e) => {
              e.preventDefault();
              window.location.href = "/index.html";
            });
        } catch (err) {}
      });
    } else if (isIndex) {
      setElementsVisibility(getEls(ids.readme), true);
      setElementsVisibility(getEls(ids.home), false);
    } else if (isExplore || isNews) {
      setElementsVisibility(getEls(ids.explore), true);
      setElementsVisibility(getEls(ids.news), true);
      setElementsVisibility(getEls(ids.logout), true);
      setElementsVisibility(getEls(ids.readme), false);
      setElementsVisibility(getEls(ids.home), false);
    } else {
      setElementsVisibility(getEls(ids.readme), true);
    }

    const logoutButtons = getEls(ids.logout);
    if (logoutButtons.length > 0) {
      logoutButtons.forEach((button) => {
        button.addEventListener("click", async (event) => {
          if (event) event.preventDefault();
          let completed = false;
          try {
            if (auth) {
              await signOut(auth);
              completed = true;
            }
          } catch (error) {
            console.warn("Auth client unavailable:", error);
          }

          if (!completed) {
            try {
              removeSessionCookie();
            } catch (e) {}
            try {
              removeCsrfCookie();
            } catch (e) {}
            try {
              localStorage.removeItem("userUid");
            } catch (e) {}
          }

          window.location.href = "/index.html";
        });
      });
    }

    initDropdownMenu();
  });
});
