const CACHE_TTL_MS = 60 * 1000;

const cacheKeyGlobal = "__AERO_NEWS_CACHE__";
const cacheStore =
  globalThis[cacheKeyGlobal] || (globalThis[cacheKeyGlobal] = new Map());

function isGetMethod(event) {
  return event.httpMethod === "GET";
}

function badMethodResponse() {
  return {
    statusCode: 405,
    body: JSON.stringify({ error: "Method not allowed" }),
  };
}

function parseQueryParams(event) {
  const section = event.queryStringParameters?.section || "technology";
  const limit = Math.min(parseInt(event.queryStringParameters?.limit) || 4, 50);
  return { section, limit };
}

function buildGuardianUrl(apiKey, section, limit) {
  const baseUrl = "https://content.guardianapis.com/search";
  const params = new URLSearchParams({
    section,
    "page-size": limit,
    "show-fields": "thumbnail,trailText",
    "api-key": apiKey,
  });
  return `${baseUrl}?${params}`;
}

async function fetchGuardian(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Guardian API error: ${response.status}`);
  }
  return response.json();
}

function successResponse(data) {
  return {
    statusCode: 200,
    body: JSON.stringify(data.response || data),
  };
}

function errorResponse() {
  return {
    statusCode: 500,
    body: JSON.stringify({ error: "Failed to fetch news" }),
  };
}

function getCacheKey(section, limit) {
  return `${section}:${limit}`;
}

function getCachedPayload(key) {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cacheStore.delete(key);
    return null;
  }
  return entry.payload;
}

function setCachedPayload(key, payload) {
  cacheStore.set(key, { payload, timestamp: Date.now() });
}

export async function handler(event) {
  if (!isGetMethod(event)) {
    return badMethodResponse();
  }

  const apiKey = process.env.GUARDIAN_API_KEY;
  if (!apiKey) {
    return errorResponse();
  }

  try {
    const { section, limit } = parseQueryParams(event);
    const cacheKey = getCacheKey(section, limit);
    const cached = getCachedPayload(cacheKey);
    if (cached) {
      return successResponse(cached);
    }

    const url = buildGuardianUrl(apiKey, section, limit);
    const data = await fetchGuardian(url);
    const payload = data.response || data;
    setCachedPayload(cacheKey, payload);
    return successResponse(payload);
  } catch (error) {
    console.error("News fetch error:", error);
    return errorResponse();
  }
}
