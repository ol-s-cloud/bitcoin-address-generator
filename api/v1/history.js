import { databaseConfigured, ensureSchema, publicObservationHistory } from "../../server/database.js";

const ALLOWED_REGIONS = new Set(["GB", "global"]);

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "method_not_allowed" });
  }
  if (!databaseConfigured()) return response.status(503).json({ error: "history_unavailable" });
  const metric = String(request.query?.metric || "").trim();
  const region = String(request.query?.region || "GB").trim();
  if (!ALLOWED_REGIONS.has(region)) return response.status(400).json({ error: "unsupported_region" });
  try {
    await ensureSchema();
    const observations = await publicObservationHistory({ metricCode: metric, region, hours: request.query?.hours, limit: request.query?.limit });
    response.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return response.status(200).json({ metric, region, observations });
  } catch (error) {
    if (error?.message === "unsupported_public_metric") return response.status(400).json({ error: error.message });
    console.error("COBRA public history read failed", { name: error?.name, code: error?.code });
    return response.status(503).json({ error: "history_unavailable" });
  }
}
