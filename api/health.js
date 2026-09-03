import {
  DatabaseConfigurationError,
  database,
  databaseConfigured,
  ensureSchema,
} from "../server/database.js";
import { noStore } from "../server/http.js";

export default async function handler(request, response) {
  noStore(response);
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "method_not_allowed" });
  }

  if (!databaseConfigured()) {
    return response.status(503).json({
      service: "cobra-state",
      database: "not_configured",
      schema: "unavailable",
    });
  }

  try {
    await ensureSchema();
    const sql = database();
    await sql`select 1 as connected`;
    return response.status(200).json({
      service: "cobra-state",
      database: "connected",
      schema: "ready",
    });
  } catch (error) {
    const configurationError = error instanceof DatabaseConfigurationError;
    console.error("COBRA database health check failed", {
      name: error?.name,
      code: error?.code,
    });
    return response.status(503).json({
      service: "cobra-state",
      database: configurationError ? "not_configured" : "unavailable",
      schema: "unavailable",
    });
  }
}
