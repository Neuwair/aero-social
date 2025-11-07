import { showAlert } from "../../animations/alert-messages.js";

const loginErrorMatchers = [
  {
    match: (msg) =>
      msg.includes("Invalid email or password") ||
      msg.includes("user-not-found") ||
      msg.includes("wrong-password"),
    message: "Invalid email or password.",
    target: (form) =>
      (form &&
        (form.querySelector('[data-alert="password"]') ||
          form.querySelector("#passwordAlert"))) ||
      document.getElementById("passwordAlert"),
  },
  {
    match: (msg) =>
      msg.includes("invalid-email") || msg.includes("Invalid email"),
    message: "Please enter a valid email address.",
    target: (form) =>
      (form &&
        (form.querySelector('[data-alert="email"]') ||
          form.querySelector("#emailAlert"))) ||
      document.getElementById("emailAlert"),
  },
  {
    match: (msg) => msg.includes("user-disabled") || msg.includes("disabled"),
    message: "Your account has been disabled. Please contact support.",
    target: (form) =>
      (form &&
        (form.querySelector('[data-alert="password"]') ||
          form.querySelector("#passwordAlert"))) ||
      document.getElementById("passwordAlert"),
  },
  {
    match: (msg) =>
      msg.includes("too many requests") || msg.includes("too-many-requests"),
    message: "Too many login attempts. Please try again later.",
    target: (form) =>
      (form &&
        (form.querySelector('[data-alert="password"]') ||
          form.querySelector("#passwordAlert"))) ||
      document.getElementById("passwordAlert"),
  },
  {
    match: (msg) => msg.includes("temporarily locked"),
    message: (msg) => msg,
    target: (form) =>
      (form &&
        (form.querySelector('[data-alert="password"]') ||
          form.querySelector("#passwordAlert"))) ||
      document.getElementById("passwordAlert"),
  },
];

export function handleLoginError(error, form) {
  console.error("Login failed:", error && error.message);
  const errorMsg = (error && error.message) || "";
  let errorMessage = "Login failed. Please check your credentials.";
  let targetAlert =
    (form &&
      (form.querySelector('[data-alert="password"]') ||
        form.querySelector("#passwordAlert"))) ||
    document.getElementById("passwordAlert");

  for (const matcher of loginErrorMatchers) {
    if (matcher.match(errorMsg)) {
      errorMessage =
        typeof matcher.message === "function"
          ? matcher.message(errorMsg)
          : matcher.message;
      targetAlert = matcher.target(form);
      break;
    }
  }

  if (!errorMsg) {
    errorMessage = "Login error. Please try again later.";
  }

  showAlert(targetAlert, errorMessage);
}
