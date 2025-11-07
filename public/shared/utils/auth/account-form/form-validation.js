import { secureAPI } from "../../api/api-csrf.js";
import {
  validateUsername,
  checkUsernameAvailability,
} from "../validate-username-client.js";
import { validateEmail } from "../validate-email.js";
import { validatePassword } from "../validate-password.js";

export function validateFormInputs(isLoginAttempt, username, form) {
  if (isLoginAttempt) {
    return validateEmail(form) && validatePassword(true, form);
  }
  const usernameAlert = document.getElementById("usernameAlert");
  const isUsernameValid = validateUsername(
    false,
    username,
    usernameAlert,
    (value) => checkUsernameAvailability(value, usernameAlert, secureAPI)
  );
  const isEmailValid = validateEmail(form);
  const isPasswordValid = validatePassword(false, form);
  return isUsernameValid && isEmailValid && isPasswordValid;
}
