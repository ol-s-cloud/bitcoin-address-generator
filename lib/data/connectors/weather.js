import { fetchJson } from "../http.js";

const DEFAULT_SITE = {
  id: "gb-reference-birmingham",
  name: "GB reference site",
  latitude: 52.4862,
  longitude: -1.8904,
};

export async function getGbWeather(options = {}) {
  const site = { ...DEFAULT_SITE, ...(options.site || {}) };
  const fetcher = options.fetcher ?? fetchJson;
  const endpoint = buildEndpoint(site);
  const attemptedAt = new Date().toISOString();

  try {
    const { data, latencyMs, fetchedAt } = await fetcher(endpoint);
    const current = data?.current;
    if (!current?.time) throw new Error("invalid_open_meteo_payload");

    const observedAt = new Date(current.time).toISOString();
    const hourlyTimes = Array.isArray(data?.hourly?.time) ? data.hourly.time : [];
    const radiationValues = Array.isArray(data?.hourly?.shortwave_radiation)
      ? data.hourly.shortwave_radiation
      : [];
    const radiationIndex = hourlyTimes.findIndex((time) => time === current.time);

    return {
      source: {
        id: "open-meteo",
        provider: "Open-Meteo",
        dataset: "GB Weather Observation",
        endpoint,
        licence: "Open-Meteo terms and source dataset attribution",
      },
      metric: {
        region: "GB",
        code: "weather_conditions",
        value: numberOrNull(current.temperature_2m),
        unit: "degC",
        observedAt,
        site: {
          id: site.id,
          name: site.name,
          latitude: Number(site.latitude),
          longitude: Number(site.longitude),
        },
        temperatureC: numberOrNull(current.temperature_2m),
        humidityPct: numberOrNull(current.relative_humidity_2m),
        windSpeedKmh: numberOrNull(current.wind_speed_10m),
        windDirectionDeg: numberOrNull(current.wind_direction_10m),
        cloudCoverPct: numberOrNull(current.cloud_cover),
        shortwaveRadiationWm2:
          radiationIndex >= 0 ? numberOrNull(radiationValues[radiationIndex]) : null,
      },
      health: {
        status: "operational",
        lastAttemptAt: attemptedAt,
        lastSuccessAt: fetchedAt,
        latencyMs,
        latestDataTimestamp: observedAt,
        stale: Date.now() - Date.parse(observedAt) > 2 * 60 * 60 * 1000,
        lastError: null,
      },
    };
  } catch (error) {
    return {
      source: {
        id: "open-meteo",
        provider: "Open-Meteo",
        dataset: "GB Weather Observation",
        endpoint,
        licence: "Open-Meteo terms and source dataset attribution",
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

function buildEndpoint(site) {
  const params = new URLSearchParams({
    latitude: String(site.latitude),
    longitude: String(site.longitude),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "wind_speed_10m",
      "wind_direction_10m",
      "cloud_cover",
    ].join(","),
    hourly: "shortwave_radiation",
    forecast_days: "1",
    timezone: "UTC",
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
