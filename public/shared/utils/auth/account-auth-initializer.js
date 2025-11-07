import auth from "./auth-client.js";

let authInstance;

async function initializeAuth() {
  if (authInstance) {
    return { success: true, auth: authInstance };
  }

  try {
    authInstance = auth;
    await authInstance.checkSession();
    return { success: true, auth: authInstance };
  } catch (error) {
    console.error("Error initializing auth:", error);
    return { success: false, error: error.message };
  }
}

async function initializeAuthWithAlert() {
  const result = await initializeAuth();
  if (!result.success) {
    console.error("Auth initialization failed:", result.error);
  }
  return result;
}

async function initializeAuthWithErrorHandling(errorCallback) {
  const result = await initializeAuth();
  if (!result.success) {
    const errorMessage =
      "Authentication service is unavailable. Please try again later.";
    console.error("Auth not initialized.");
    if (errorCallback) {
      errorCallback(errorMessage);
    }
    return null;
  }

  const auth = getAuth();
  if (!auth) {
    const errorMessage =
      "Authentication service is unavailable. Please try again later.";
    console.error("Auth not initialized.");
    if (errorCallback) {
      errorCallback(errorMessage);
    }
    return null;
  }

  return auth;
}

function getAuth() {
  return authInstance || auth;
}

export {
  initializeAuth,
  initializeAuthWithAlert,
  initializeAuthWithErrorHandling,
  getAuth,
};
