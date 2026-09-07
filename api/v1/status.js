import { getNesoCarbonIntensity } from "../../lib/data/connectors/neso-carbon.js";
import { getElexonDemand, getElexonMarketPrice } from "../../lib/data/connectors/elexon.js";
import { persistObservations } from "../../lib/data/persistence.js";
import { DATA_SOURCES } from "../../lib/data/sources.js";

export default async function handler(_request, response) {
  const checkedAt = new Date().toISOString();
  const settled = await Promise.allSettled([
    getNesoCarbonIntensity(),
    getElexonMarketPrice(),
    getElexonDemand(),
  ]);

  const connectors = settled.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    const sourceIds = ["neso-carbon-intensity", "elexon-mid", "elexon-itsdo"];
    return {
      source: { id: sourceIds[index] },
      metric: null,
      health: {
        status: "unavailable",
        lastAttemptAt: checkedAt,
        lastSuccessAt: null,
        latencyMs: 0,
        latestDataTimestamp: null,
        stale: true,
        lastError: String(result.reason?.message || "connector_failed"),
      },
    };
  });

  let persistence;
  try {
    persistence = await persistObservations(connectors);
  } catch (error) {
    console.error("COBRA observation persistence failed", {
      name: error?.name,
      code: error?.code,
    });
    persistence = {
      enabled: true,
      saved: 0,
      skipped: connectors.length,
      error: "persistence_unavailable",
    };
  }

  const operational = connectors.filter((item) => item.health.status === "operational").length;
  const stale = connectors.filter((item) => item.health.stale).length;
  const overall = operational === connectors.length ? (stale ? "degraded" : "operational") : operational ? "degraded" : "unavailable";

  response.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
  return response.status(overall === "unavailable" ? 503 : 200).json({
    platform: "COBRA Data Platform",
    version: "v1",
    checkedAt,
    status: overall,
    summary: {
      connected: connectors.length,
      operational,
      unavailable: connectors.length - operational,
      stale,
      registeredSources: DATA_SOURCES.length,
    },
    persistence,
    connectors,
    sources: DATA_SOURCES,
  });
}
