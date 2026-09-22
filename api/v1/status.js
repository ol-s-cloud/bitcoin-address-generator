import { persistObservations } from "../../lib/data/persistence.js";
import { DATA_SOURCES } from "../../lib/data/sources.js";
import { collectLiveSnapshot, metricMap } from "../../lib/data/snapshot.js";
import { derivePublicIndicatorsFromMetrics } from "../../lib/indicators/public.js";

export default async function handler(_request, response) {
  const snapshot = await collectLiveSnapshot();
  const metrics = metricMap(snapshot.connectors);
  const indicators = derivePublicIndicatorsFromMetrics(metrics, { region: "GB" });

  let persistence;
  try {
    persistence = await persistObservations(snapshot.connectors);
  } catch (error) {
    console.error("COBRA observation persistence failed", {
      name: error?.name,
      code: error?.code,
    });
    persistence = {
      enabled: true,
      saved: 0,
      skipped: snapshot.connectors.length,
      error: "persistence_unavailable",
    };
  }

  response.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
  return response.status(snapshot.status === "unavailable" ? 503 : 200).json({
    platform: "COBRA Data Platform",
    version: "v1",
    checkedAt: snapshot.checkedAt,
    status: snapshot.status,
    summary: {
      ...snapshot.summary,
      registeredSources: DATA_SOURCES.length,
    },
    indicators,
    persistence,
    connectors: snapshot.connectors,
    sources: DATA_SOURCES,
  });
}
