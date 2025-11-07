const isGetMethod = (event) => event.httpMethod === "GET";

const getApiKey = () => process.env.PIXABAY_API_KEY;

const parseParams = (event) => {
  const query = event.queryStringParameters?.q || "food";
  const perPage = Math.min(
    parseInt(event.queryStringParameters?.per_page) || 20,
    200
  );
  return { query, perPage };
};

const buildPixabayUrl = (apiKey, query, perPage) =>
  `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(
    query
  )}&image_type=photo&per_page=${perPage}`;

const fetchFromUrl = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const makeResponse = (statusCode, bodyObj) => ({
  statusCode,
  body: JSON.stringify(bodyObj),
});

export const handler = async (event) => {
  if (!isGetMethod(event)) {
    return makeResponse(405, { error: "Method not allowed" });
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return makeResponse(500, { error: "API key not configured" });
  }

  try {
    const { query, perPage } = parseParams(event);
    const url = buildPixabayUrl(apiKey, query, perPage);
    const data = await fetchFromUrl(url);

    return makeResponse(200, data);
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return makeResponse(500, { error: "Failed to fetch gallery" });
  }
};

export default handler;
