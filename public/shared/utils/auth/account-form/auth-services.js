import { showAlert, hideAlert } from "../../animations/alert-messages.js";
import { initializeAuthWithErrorHandling } from "../account-auth-initializer.js";
import { validateEmailUniqueness } from "../validate-email.js";
import { handleLoginError } from "./login-errors.js";
import { handleRegistrationError } from "./registration-errors.js";

export async function handleUserLogin(auth, email, password, form) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(
      email,
      password
    );
    const { refreshCsrfToken } = await import(
      "../../security/initializer-csrf.js"
    );
    await refreshCsrfToken();
    console.log("Login successful:", userCredential.user);
    window.location.href = "/pages/explore/explore.html";
  } catch (error) {
    console.error("Login failed:", error);
    handleLoginError(error, form);
  }
}

export async function handleUserRegistration(auth, userData, form) {
  const { username, email, password, bio } = userData;

  const isEmailUnique = await validateEmailUniqueness(email, form);
  if (!isEmailUnique) {
    console.log("Registration error. Aborting registration.");
    return;
  }

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(
      email,
      password,
      username,
      bio || ""
    );
    const { refreshCsrfToken } = await import(
      "../../security/initializer-csrf.js"
    );
    await refreshCsrfToken();
    console.log("Registration successful:", userCredential.user);
    const joinContainer = form ? form.closest(".form_container") : null;
    const loginContainer = document.getElementById("loginFormContainer");
    if (joinContainer && loginContainer) {
      joinContainer.style.display = "none";
      loginContainer.style.display = "";
      const loginEmail = document.getElementById("loginEmailInput");
      if (loginEmail) loginEmail.value = email;
      const loginPassword = document.getElementById("loginPasswordInput");
      const loginConfirm = document.getElementById("loginConfirmPasswordInput");
      if (loginPassword) loginPassword.value = "";
      if (loginConfirm) loginConfirm.value = "";
      const inputs = form.querySelectorAll("input");
      inputs.forEach((input) => (input.value = ""));
      const loginEmailAlert =
        loginContainer.querySelector('[data-alert="email"]') ||
        document.getElementById("loginEmailAlert");
      if (loginEmailAlert) hideAlert(loginEmailAlert);
      const focusPw = document.getElementById("loginPasswordInput");
      if (focusPw) focusPw.focus();
    } else {
      alert("Registration successful! Please log in.");
    }
  } catch (error) {
    console.error("Registration error:", error);
    handleRegistrationError(error, form);
  }
}

export async function createAuthWithHandler() {
  const auth = await initializeAuthWithErrorHandling((errorMessage) => {
    console.error("Auth initialization failed:", errorMessage);
    showAlert(
      document.getElementById("emailAlert"),
      "Authentication service is unavailable. Please try again later."
    );
  });
  return auth;
}
