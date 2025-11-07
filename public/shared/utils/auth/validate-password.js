import { showAlert, hideAlert } from "../animations/alert-messages.js";

function getPasswordInputs(form = document) {
  const scope = form || document;
  const passwordInput =
    scope.querySelector('[name="password"]') ||
    scope.querySelector("#passwordInput");
  const confirmPasswordInput =
    scope.querySelector('[name="confirmPassword"]') ||
    scope.querySelector("#confirmPasswordInput");
  const passwordAlert =
    scope.querySelector('[data-alert="password"]') ||
    scope.querySelector("#passwordAlert");

  const password = passwordInput ? passwordInput.value : "";
  const confirmPassword = confirmPasswordInput
    ? confirmPasswordInput.value
    : "";

  return { password, confirmPasswordInput, confirmPassword, passwordAlert };
}

function validateRules(password) {
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one digit.";
  }
  if (!/[!@#$%^&*(),.?":{}|<>\[\]\\/~`_+=;'\-]/.test(password)) {
    return "Password must contain at least one special character.";
  }
  return "";
}

function checkConfirmPassword(
  password,
  confirmPasswordInput,
  confirmPassword,
  isLogin
) {
  if (!isLogin && confirmPasswordInput && password !== confirmPassword) {
    return "Passwords do not match!";
  }
  return "";
}

function updateAlert(passwordAlert, errorMessage) {
  if (errorMessage) {
    showAlert(passwordAlert, errorMessage);
  } else {
    hideAlert(passwordAlert);
  }
}

export function validatePassword(isLogin = false, form = document) {
  const { password, confirmPasswordInput, confirmPassword, passwordAlert } =
    getPasswordInputs(form);

  let errorMessage = validateRules(password);
  const confirmError = checkConfirmPassword(
    password,
    confirmPasswordInput,
    confirmPassword,
    isLogin
  );

  if (confirmError) {
    errorMessage = confirmError;
  }

  const hasError = errorMessage !== "";

  updateAlert(passwordAlert, errorMessage);

  return !hasError;
}
