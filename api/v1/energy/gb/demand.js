import { getElexonDemand } from "../../../../lib/data/connectors/elexon.js";

export default async function handler(_request, response) {
  const result = await getElexonDemand();
  response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=900");
  return response.status(result.health.status === "operational" ? 200 : 502).json(result);
}
