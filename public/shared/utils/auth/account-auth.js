import { secureAPI } from "../api/api-csrf.js";
import { showAlert, hideAlert } from "../animations/alert-messages.js";
import { accountFormSubmission } from "./account-form/index.js";
import {
  validateUsername,
  checkUsernameAvailability,
} from "./validate-username-client.js";
import { validatePassword } from "./validate-password.js";
import { validateEmail } from "./validate-email.js";
import { initializeAuthWithAlert } from "./account-auth-initializer.js";

function setupUsernameValidation() {
  const usernameInput = document.getElementById("usernameInput");
  const usernameAlert = document.getElementById("usernameAlert");
  if (usernameInput) {
    let usernameTimeout;
    usernameInput.addEventListener("input", () => {
      clearTimeout(usernameTimeout);
      usernameTimeout = setTimeout(() => {
        if (usernameAlert) {
          validateUsername(
            false,
            usernameInput.value,
            usernameAlert,
            (username) =>
              checkUsernameAvailability(username, usernameAlert, secureAPI)
          );
        }
      }, 500);
    });
  }
}

function initAccountFormUI() {
  document
    .querySelectorAll(
      ".password-accept-background, .password-confirm-background"
    )
    .forEach((wrap) => {
      const input = wrap.querySelector("input");
      const toggleIcon = wrap.querySelector("i");

      toggleIcon.addEventListener("click", () => {
        const isHidden = input.type === "password";
        input.type = isHidden ? "text" : "password";

        toggleIcon.classList.replace(
          isHidden ? "fa-eye-slash" : "fa-eye",
          isHidden ? "fa-eye" : "fa-eye-slash"
        );
      });
    });

  setupUsernameValidation();
}

function isExplorePath(pathname) {
  if (!pathname) return false;
  if (pathname.includes("explore.html")) return true;
  return pathname.includes("/pages/explore/");
}

async function resolveCurrentUser(auth) {
  let currentUser = auth.getCurrentUser();
  if (currentUser) {
    return currentUser;
  }

  try {
    const result = await auth.checkSession();
    if (result) {
      currentUser = auth.getCurrentUser();
      if (currentUser) {
        return currentUser;
      }
    }
  } catch (error) {}

  return auth.getCurrentUser();
}

async function handleUserVerificationOnLoad() {
  await initializeAuthWithAlert();
  const auth = window.auth;

  await new Promise((resolve) => setTimeout(resolve, 50));

  try {
    const pathname = window.location.pathname || "";
    const onExplore = isExplorePath(pathname);

    const currentUser = await resolveCurrentUser(auth);
    const hasSessionCookie = Boolean(auth.getSessionFromCookie());
    const storedUid = (() => {
      try {
        return localStorage.getItem("userUid");
      } catch (e) {
        return null;
      }
    })();
    const authenticated =
      Boolean(currentUser) || hasSessionCookie || Boolean(storedUid);

    if (authenticated) {
      if (!onExplore) {
        window.location.replace("/pages/explore/explore.html");
        return false;
      }
      return true;
    }

    if (onExplore) {
      window.location.replace("/index.html");
      return false;
    }

    window.location.href = "/";
    return false;
  } catch (error) {
    if (!isExplorePath(window.location.pathname || "")) {
      window.location.href = "/";
    }
    return false;
  }
}

export {
  initAccountFormUI,
  accountFormSubmission,
  validatePassword,
  validateEmail,
  handleUserVerificationOnLoad,
};
