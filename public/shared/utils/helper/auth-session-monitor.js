function setupAuthSessionMonitor(authClient) {
  if (typeof window === "undefined") return;
  if (authClient._sessionMonitorId !== null) return;

  const runCheck = () => {
    if (authClient.currentUser || authClient._hasStoredUserUid()) {
      authClient.checkSession();
    }
  };

  authClient._sessionMonitorId = window.setInterval(
    runCheck,
    authClient._sessionMonitorInterval
  );

  if (!authClient._sessionVisibilityHandler) {
    const handler = () => {
      if (document.visibilityState === "visible") {
        runCheck();
      }
    };
    authClient._sessionVisibilityHandler = handler;
    window.addEventListener("visibilitychange", handler);
  }
}

export { setupAuthSessionMonitor };
