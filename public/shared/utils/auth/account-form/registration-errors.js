import { showAlert } from "../../animations/alert-messages.js";

const registrationErrorMatchers = [
  {
    match: (msg) => msg.includes("email already in use"),
    message: "Registration error. Please try again later.",
    target: (form) =>
      (form &&
        (form.querySelector('[data-alert="email"]') ||
          form.querySelector("#emailAlert"))) ||
      document.getElementById("emailAlert"),
  },
  {
    match: (msg) => msg.includes("username taken"),
    message: "This username is already taken.",
    target: (form) =>
      (form &&
        (form.querySelector('[data-alert="username"]') ||
          form.querySelector("#usernameAlert"))) ||
      document.getElementById("usernameAlert"),
  },
];

export function handleRegistrationError(result, form) {
  let targetAlert =
    (form &&
      (form.querySelector('[data-alert="password"]') ||
        form.querySelector("#passwordAlert"))) ||
    document.getElementById("passwordAlert");
  let registrationErrorMessage =
    result.message || "An error occurred during registration.";

  for (const matcher of registrationErrorMatchers) {
    if (matcher.match(registrationErrorMessage)) {
      registrationErrorMessage =
        typeof matcher.message === "function"
          ? matcher.message(registrationErrorMessage)
          : matcher.message;
      targetAlert = matcher.target(form);
      break;
    }
  }

  showAlert(targetAlert, registrationErrorMessage);
  console.error("Registration error:", result.message);
}
