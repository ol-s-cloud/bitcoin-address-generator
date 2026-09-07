import { readHistory } from "../../lib/data/history.js";

export default async function handler(request, response) {
  try {
    const result = await readHistory({
      metric: request.query?.metric,
      region: request.query?.region,
      hours: request.query?.hours,
      limit: request.query?.limit,
    });
    response.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return response.status(200).json({
      platform: "COBRA Data Platform",
      version: "v1",
      ...result,
    });
  } catch (error) {
    console.error("COBRA history request failed", {
      name: error?.name,
      code: error?.code,
    });
    return response.status(500).json({ error: "history_unavailable" });
  }
}
