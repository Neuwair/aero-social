import { secureAPI } from "../api/api-csrf.js";
import { requestUserData } from "./fetch-user-data.js";

async function fetchUsername() {
  let username = "Anonymous";
  try {
    const csrfToken = await secureAPI.getCsrfToken();
    const response = await requestUserData({ uid: null, csrfToken });
    if (response.ok) {
      const userData = await response.json();
      if (userData && userData.username) {
        username = userData.username;
      }
    } else {
      console.log("No user data found in database");
    }
  } catch (error) {
    console.error("Error fetching username for new post:", error);
  }
  return username;
}

export { fetchUsername };
