import { initAccountFormUI } from "../../shared/utils/auth/account-auth.js";
import { accountFormSubmission } from "../../shared/utils/auth/account-form/index.js";
import {
  validateUsername,
  checkUsernameAvailability,
} from "../utils/auth/validate-username-client.js";
import { validateEmail } from "../utils/auth/validate-email.js";
import { validatePassword } from "../utils/auth/validate-password.js";
import { secureAPI } from "../utils/api/api-csrf.js";
import { initAlertPopUp } from "../utils/animations/alert-pop-up.js";

function injectHome(selector, filePath) {
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
  injectHome("#injectHome", "/shared/components/global-inject-home.html").then(
    () => {
      requestAnimationFrame(() => {
        accountFormSubmission();
        initAccountFormUI();
        initAlertPopUp();

        const usernameInput = document.getElementById("usernameInput");
        const emailInput = document.getElementById("emailInput");
        const passwordInput = document.getElementById("passwordInput");
        const confirmPasswordInput = document.getElementById(
          "confirmPasswordInput"
        );

        if (usernameInput) {
          const usernameAlert = document.getElementById("usernameAlert");
          usernameInput.addEventListener("input", () => {
            validateUsername(
              false,
              usernameInput.value,
              usernameAlert,
              (username) =>
                checkUsernameAvailability(username, usernameAlert, secureAPI)
            );
          });
        }
        if (emailInput) {
          emailInput.addEventListener("input", () => validateEmail(joinFormEl));
        }
        if (passwordInput) {
          passwordInput.addEventListener("input", () =>
            validatePassword(false, joinFormEl)
          );
        }
        if (confirmPasswordInput) {
          confirmPasswordInput.addEventListener("input", () =>
            validatePassword(false, joinFormEl)
          );
        }
        const showLoginBtn = document.getElementById("showLoginBtn");
        const showJoinBtn = document.getElementById("showJoinBtn");
        const loginFormContainer =
          document.getElementById("loginFormContainer");
        const joinFormEl = document.getElementById("joinForm");
        const joinFormContainer = joinFormEl
          ? joinFormEl.closest(".form_container")
          : null;

        function clearFormInputs(form) {
          if (!form) return;
          const inputs = form.querySelectorAll("input");
          inputs.forEach((inp) => (inp.value = ""));
          const alerts = form.querySelectorAll(".alert-item");
          alerts.forEach((a) => {
            a.innerHTML = "";
            a.style.display = "none";
          });
        }

        const loadingPopup = document.getElementById("aero-loading-popup");
        let _loadingOriginalOverflow = null;

        function showLoadingOverlay() {
          if (!loadingPopup) return;
          loadingPopup.style.display = "flex";
          loadingPopup.style.alignItems = "center";
          loadingPopup.style.justifyContent = "center";
          loadingPopup.setAttribute("aria-hidden", "false");
          _loadingOriginalOverflow = document.body.style.overflow;
          document.body.style.overflow = "hidden";
          requestAnimationFrame(() => {
            loadingPopup.classList.remove("closing");
            loadingPopup.classList.add("visible");
          });
        }

        function hideLoadingOverlay() {
          if (!loadingPopup) return;
          loadingPopup.classList.remove("visible");
          loadingPopup.classList.add("closing");
          const EXIT_ANIM_MS = 360;
          setTimeout(() => {
            try {
              loadingPopup.classList.remove("closing");
              loadingPopup.setAttribute("aria-hidden", "true");
              loadingPopup.style.display = "none";
              document.body.style.overflow = _loadingOriginalOverflow || "";
            } catch (e) {}
          }, EXIT_ANIM_MS);
        }

        async function detectUserAuthState({ timeout = 10000 } = {}) {
          return new Promise((resolve) => {
            let finished = false;

            const timer = setTimeout(() => {
              if (!finished) {
                finished = true;
                cleanup();
                resolve({ reason: "timeout" });
              }
            }, timeout);

            let unsubscribe = null;
            try {
              const { auth } = window;
              if (auth && typeof auth.onAuthStateChanged === "function") {
                unsubscribe = auth.onAuthStateChanged((user) => {
                  if (user) {
                    if (!finished) {
                      finished = true;
                      clearTimeout(timer);
                      cleanup();
                      resolve({ reason: "auth", user });
                    }
                  }
                });
              }
            } catch (e) {}

            const joinContainerEl = joinFormContainer;
            const loginContainerEl = loginFormContainer;
            let observer = null;
            if (
              joinContainerEl &&
              loginContainerEl &&
              typeof MutationObserver !== "undefined"
            ) {
              observer = new MutationObserver(() => {
                try {
                  const joinHidden = joinContainerEl.style.display === "none";
                  const loginVisible =
                    loginContainerEl.style.display !== "none" &&
                    loginContainerEl.style.display !== "hidden";
                  if (joinHidden && loginVisible && !finished) {
                    finished = true;
                    clearTimeout(timer);
                    cleanup();
                    resolve({ reason: "ui-switch" });
                  }
                } catch (e) {}
              });

              observer.observe(joinContainerEl, {
                attributes: true,
                attributeFilter: ["style"],
              });
              observer.observe(loginContainerEl, {
                attributes: true,
                attributeFilter: ["style"],
              });
            }

            function cleanup() {
              try {
                if (unsubscribe && typeof unsubscribe === "function")
                  unsubscribe();
              } catch (e) {}
              try {
                if (observer) observer.disconnect();
              } catch (e) {}
            }
          });
        }

        const joinFormElRef = document.getElementById("joinForm");
        const loginFormElRef = document.getElementById("loginForm");

        function onFormSubmitShowOverlay(e) {
          try {
            const form = e && e.target ? e.target : null;
            if (form && !isFormValidOnClient(form)) {
              hideLoadingOverlay();
              return;
            }

            const isLoginSubmission = form && form.id === "loginForm";

            showLoadingOverlay();
            detectUserAuthState({ timeout: 12000 })
              .then((res) => {
                if (isLoginSubmission) {
                  if (res && res.reason === "auth") {
                    return;
                  }
                  hideLoadingOverlay();
                  return;
                }
                hideLoadingOverlay();
              })
              .catch(() => {
                hideLoadingOverlay();
              });
          } catch (err) {
            hideLoadingOverlay();
          }
        }

        function isFormValidOnClient(form) {
          if (!form) return false;
          try {
            if (form.id === "joinForm") {
              const username = form.querySelector("#usernameInput");
              const usernameAlert = document.getElementById("usernameAlert");
              const usernameVal = username ? username.value.trim() : "";
              const usernameOk =
                usernameVal.length > 0 &&
                validateUsername(false, usernameVal, usernameAlert, (u) =>
                  checkUsernameAvailability(u, usernameAlert, secureAPI)
                );
              const emailOk = validateEmail(form);
              const pwOk = validatePassword(false, form);
              return usernameOk && emailOk && pwOk;
            }
            if (form.id === "loginForm") {
              const emailOk = validateEmail(form);
              const pwOk = validatePassword(true, form);
              return emailOk && pwOk;
            }
          } catch (e) {
            return false;
          }
          return false;
        }

        if (joinFormElRef)
          joinFormElRef.addEventListener("submit", onFormSubmitShowOverlay, {
            capture: true,
          });
        if (loginFormElRef)
          loginFormElRef.addEventListener("submit", onFormSubmitShowOverlay, {
            capture: true,
          });

        if (showLoginBtn && loginFormContainer && joinFormContainer) {
          showLoginBtn.addEventListener("click", () => {
            joinFormContainer.style.display = "none";
            loginFormContainer.style.display = "";
            clearFormInputs(document.getElementById("joinForm"));
            const e = document.getElementById("loginEmailInput");
            if (e) e.focus();
          });
        }

        if (showJoinBtn && loginFormContainer && joinFormContainer) {
          showJoinBtn.addEventListener("click", () => {
            loginFormContainer.style.display = "none";
            joinFormContainer.style.display = "";
            clearFormInputs(document.getElementById("loginForm"));
            const e = document.getElementById("usernameInput");
            if (e) e.focus();
          });
        }
      });
    }
  );
});
