import { getNesoCarbonIntensity } from "./connectors/neso-carbon.js";
import { getNesoConstraints } from "./connectors/neso-constraints.js";
import { getElexonDemand, getElexonMarketPrice } from "./connectors/elexon.js";
import { getElexonGenerationMix, getElexonIndicatedMargin } from "./connectors/elexon-operations.js";
import { getElexonSystemPrice, getElexonSurplus } from "./connectors/elexon-market-signals.js";
import { getGbWeather } from "./connectors/weather.js";
import { getBitcoinNetworkState } from "./connectors/bitcoin-network.js";

export const LIVE_SOURCE_IDS = [
  "neso-carbon-intensity",
  "elexon-mid",
  "elexon-itsdo",
  "elexon-fuelinst",
  "elexon-melngc",
  "elexon-system-price",
  "elexon-ocnmfd",
  "neso-constraint-breakdown",
  "open-meteo",
  "bitcoin-network",
];

export async function collectLiveSnapshot() {
  const checkedAt = new Date().toISOString();
  const settled = await Promise.allSettled([
    getNesoCarbonIntensity(),
    getElexonMarketPrice(),
    getElexonDemand(),
    getElexonGenerationMix(),
    getElexonIndicatedMargin(),
    getElexonSystemPrice(),
    getElexonSurplus(),
    getNesoConstraints(),
    getGbWeather(),
    getBitcoinNetworkState(),
  ]);

  const connectors = settled.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    return {
      source: { id: LIVE_SOURCE_IDS[index] },
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

  const operational = connectors.filter((item) => item.health?.status === "operational").length;
  const stale = connectors.filter((item) => item.health?.stale).length;
  const status = operational === connectors.length
    ? (stale ? "degraded" : "operational")
    : operational
      ? "degraded"
      : "unavailable";

  return {
    checkedAt,
    status,
    summary: {
      connected: connectors.length,
      operational,
      unavailable: connectors.length - operational,
      stale,
    },
    connectors,
  };
}

export function metricMap(connectors = []) {
  return Object.fromEntries(
    connectors
      .filter((item) => item?.metric?.code)
      .map((item) => [item.metric.code, item.metric]),
  );
}
