import { initializeCsrfProtection } from "../../security/initializer-csrf.js";
import { validateFormInputs } from "./form-validation.js";
import {
  handleUserLogin,
  handleUserRegistration,
  createAuthWithHandler,
} from "./auth-services.js";

export const getFormElements = (form) => {
  const scope = form || document;
  const usernameInput = scope.querySelector("#usernameInput");
  const emailInput =
    scope.querySelector('[name="email"]') || scope.querySelector("#emailInput");
  const passwordInput =
    scope.querySelector('[name="password"]') ||
    scope.querySelector("#passwordInput");
  return { usernameInput, emailInput, passwordInput };
};

export const extractSubmissionInfo = (event) => {
  const submitterId = event.submitter ? event.submitter.id : null;
  const isLoginAttempt = submitterId === "loginBtn";
  const form = event.target || document;
  const { usernameInput, emailInput, passwordInput } = getFormElements(form);
  const username = usernameInput ? usernameInput.value : "";
  const email = emailInput ? emailInput.value : "";
  const password = passwordInput ? passwordInput.value : "";
  const bioInput =
    form.querySelector("#bioInput") || document.getElementById("bioInput");
  const bio = bioInput ? bioInput.value : "";
  return { submitterId, isLoginAttempt, username, email, password, bio, form };
};

export const processSubmission = async (
  auth,
  isLoginAttempt,
  username,
  email,
  password,
  bio,
  form
) => {
  const isValid = validateFormInputs(isLoginAttempt, username, form);
  if (!isValid) {
    console.log("Client-side validation failed.");
    return;
  }

  if (isLoginAttempt) {
    await handleUserLogin(auth, email, password, form);
  } else {
    const userData = { username, email, password, bio };
    await handleUserRegistration(auth, userData, form);
  }
};

export const handleFormSubmit = async (event) => {
  event.preventDefault();

  const auth = await createAuthWithHandler();
  if (!auth) {
    return;
  }

  const { isLoginAttempt, username, email, password, bio, form } =
    extractSubmissionInfo(event);
  await processSubmission(
    auth,
    isLoginAttempt,
    username,
    email,
    password,
    bio,
    form
  );
};

export const setupFormListener = (joinForm) => {
  joinForm.addEventListener("submit", handleFormSubmit);
};

export const accountFormSubmission = async () => {
  try {
    await initializeCsrfProtection();
  } catch (error) {
    console.warn("CSRF protection initialization failed:", error);
  }
  const joinForms = document.querySelectorAll(".join-form");
  if (joinForms && joinForms.length) {
    joinForms.forEach((form) => setupFormListener(form));
  }
};
