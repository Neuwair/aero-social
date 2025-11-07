import { initializeTables } from "../utils/database.js";

export const handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    await initializeTables();
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Database tables initialized successfully",
        success: true,
      }),
    };
  } catch (error) {
    console.error("Database initialization error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to initialize database tables",
        error: error.message,
        success: false,
      }),
    };
  }
};
