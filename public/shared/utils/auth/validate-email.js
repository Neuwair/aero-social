import { showAlert, hideAlert } from "../animations/alert-messages.js";
import { secureAPI } from "../api/api-csrf.js";

async function validateEmailUniqueness(email, form = document) {
  const scope = form || document;
  const emailAlert =
    scope.querySelector('[data-alert="email"]') ||
    scope.querySelector("#emailAlert");
  try {
    const response = await secureAPI.checkEmail(email);
    const result = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        showAlert(emailAlert, result.message);
        return false;
      }
      showAlert(
        emailAlert,
        "An error occurred while checking email availability."
      );
      console.error("Server error checking email uniqueness:", result.message);
      return false;
    }

    if (result.available === false) {
      showAlert(emailAlert, "This email is already in use.");
      return false;
    }

    hideAlert(emailAlert);
    return true;
  } catch (error) {
    console.error("Network error checking email uniqueness:", error);
    showAlert(
      emailAlert,
      "A network error occurred while checking email availability."
    );
    return false;
  }
}

function validateEmail(form = document) {
  const scope = form || document;
  const emailInput =
    scope.querySelector('[name="email"]') || scope.querySelector("#emailInput");
  const email = emailInput ? emailInput.value : "";
  const emailAlert =
    scope.querySelector('[data-alert="email"]') ||
    scope.querySelector("#emailAlert");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showAlert(emailAlert, "Please enter a valid email address.");
    return false;
  }
  hideAlert(emailAlert);
  return true;
}

export { validateEmailUniqueness, validateEmail };
