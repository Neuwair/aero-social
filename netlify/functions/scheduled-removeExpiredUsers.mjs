import { deleteExpiredUsers } from "../utils/database.js";

export default async function handler(event, context) {
  try {
    const result = await deleteExpiredUsers();
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Expired users deleted.",
        deleted:
          result && typeof result.deleted === "number" ? result.deleted : 0,
      }),
    };
  } catch (error) {
    console.error("Error deleting expired users:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to delete expired users." }),
    };
  }
}

export const config = {
  schedule: "@every 1m",
};
