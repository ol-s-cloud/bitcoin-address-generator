import { getNesoCarbonIntensity } from "../../../../lib/data/connectors/neso-carbon.js";

export default async function handler(_request, response) {
  const result = await getNesoCarbonIntensity();

  response.setHeader(
    "Cache-Control",
    "s-maxage=300, stale-while-revalidate=900",
  );

  if (result.health.status !== "operational") {
    return response.status(502).json(result);
  }

  return response.status(200).json(result);
}
