import { fetchJson } from "../http.js";

const SOURCE = "neso-carbon-intensity";
const ENDPOINT = "https://api.carbonintensity.org.uk/intensity";

export async function getNesoCarbonIntensity() {
  const attemptedAt = new Date().toISOString();

  try {
    const { data, latencyMs, fetchedAt } = await fetchJson(ENDPOINT);
    const point = Array.isArray(data?.data) ? data.data[0] : null;

    if (!point?.intensity) {
      throw new Error("invalid_neso_carbon_payload");
    }

    const forecast = numberOrNull(point.intensity.forecast);
    const actual = numberOrNull(point.intensity.actual);
    const observedValue = actual ?? forecast;

    return {
      source: {
        id: SOURCE,
        provider: "National Energy System Operator",
        dataset: "GB Carbon Intensity",
        endpoint: ENDPOINT,
        licence: "NESO Open Data Licence",
      },
      metric: {
        region: "GB",
        code: "carbon_intensity",
        value: observedValue,
        unit: "gCO2/kWh",
        actual,
        forecast,
        index: point.intensity.index ?? null,
        validFrom: point.from ?? null,
        validTo: point.to ?? null,
      },
      health: {
        status: "operational",
        lastAttemptAt: attemptedAt,
        lastSuccessAt: fetchedAt,
        latencyMs,
        latestDataTimestamp: point.from ?? point.to ?? null,
        stale: isStale(point.to),
        lastError: null,
      },
    };
  } catch (error) {
    return {
      source: {
        id: SOURCE,
        provider: "National Energy System Operator",
        dataset: "GB Carbon Intensity",
        endpoint: ENDPOINT,
        licence: "NESO Open Data Licence",
      },
      metric: null,
      health: {
        status: "unavailable",
        lastAttemptAt: attemptedAt,
        lastSuccessAt: null,
        latencyMs: Number(error?.latencyMs ?? 0),
        latestDataTimestamp: null,
        stale: true,
        lastError: String(error?.message || "unknown_error"),
      },
    };
  }
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isStale(validTo) {
  if (!validTo) return true;
  const timestamp = Date.parse(validTo);
  if (!Number.isFinite(timestamp)) return true;
  return Date.now() - timestamp > 60 * 60 * 1000;
}
