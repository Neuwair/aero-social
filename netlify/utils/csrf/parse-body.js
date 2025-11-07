export function safeParseBody(body) {
  if (!body) return null;
  if (typeof body === "object") return body;
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch (error) {
      const obj = {};
      body.split("&").forEach((pair) => {
        const [key, value] = pair.split("=");
        if (!key) return;
        try {
          obj[decodeURIComponent(key)] = decodeURIComponent(value || "");
        } catch (decodeError) {
          obj[key] = value || "";
        }
      });
      return obj;
    }
  }
  return null;
}
