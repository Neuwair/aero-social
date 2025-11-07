import { showAlert, hideAlert } from "../animations/alert-messages.js";

function validateUsername(
  isLogin = false,
  username,
  usernameAlert,
  checkUsernameAvailability
) {
  if (isLogin) {
    if (usernameAlert) {
      hideAlert(usernameAlert);
    }
    return true;
  }
  if (usernameAlert) {
    hideAlert(usernameAlert);
  }

  return true;
}

async function checkUsernameAvailability(username, usernameAlert, secureAPI) {
  if (!usernameAlert || !secureAPI) {
    console.warn("Missing required parameters for username validation");
    return false;
  }

  try {
    const response = await secureAPI.validateUsername(username);
    const result = await response.json();

    if (!response.ok) {
      if (response.status === 400) {
        showAlert(usernameAlert, result.message);
        return false;
      }
      showAlert(
        usernameAlert,
        "An error occurred while checking username availability."
      );
      return false;
    }

    if (result.valid === false) {
      showAlert(usernameAlert, result.message);
      return false;
    }

    hideAlert(usernameAlert);
    return true;
  } catch (error) {
    console.error("Network error checking username availability:", error);
    if (usernameAlert) {
      showAlert(
        usernameAlert,
        "A network error occurred while checking username availability."
      );
    }
    return false;
  }
}

export { validateUsername, checkUsernameAvailability };
