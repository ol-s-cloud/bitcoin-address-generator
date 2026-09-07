import { getNesoConstraints } from "../../../../lib/data/connectors/neso-constraints.js";

export default async function handler(_request, response) {
  const result = await getNesoConstraints();
  response.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
  return response.status(result.health.status === "operational" ? 200 : 502).json(result);
}
