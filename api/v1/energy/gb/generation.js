import { getElexonGenerationMix } from "../../../../lib/data/connectors/elexon-operations.js";

export default async function handler(_request, response) {
  const result = await getElexonGenerationMix();
  response.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
  return response.status(result.health.status === "operational" ? 200 : 502).json(result);
}
