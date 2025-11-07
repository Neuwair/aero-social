function setupAuthPublicApi(authClient) {
  if (typeof window !== "undefined") {
    window.auth = authClient;
  }
  return authClient;
}

export { setupAuthPublicApi };
