import { fetchJson } from "../http.js";

const BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1";
const LICENCE = "BMRS Data Licence";

export async function getElexonMarketPrice(options = {}) {
  const now = options.now ?? new Date();
  const fetcher = options.fetcher ?? fetchJson;
  const { from, to } = trailingWindow(now, 6);
  const endpoint = `${BASE_URL}/datasets/MID?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&format=json`;

  return runConnector({
    source: sourceMeta("elexon-mid", "Market Index Data", endpoint),
    attemptedAt: new Date().toISOString(),
    fetcher,
    endpoint,
    normalize(data) {
      const rows = Array.isArray(data?.data) ? data.data : [];
      const validRows = rows
        .map(normalizeMarketPriceRow)
        .filter(Boolean)
        .sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));

      if (!validRows.length) throw new Error("invalid_elexon_mid_payload");

      const latestTime = validRows.at(-1).observedAt;
      const latestRows = validRows.filter((row) => row.observedAt === latestTime);
      const weighted = volumeWeightedPrice(latestRows);

      return {
        metric: {
          region: "GB",
          code: "market_index_price",
          value: weighted,
          unit: "GBP/MWh",
          observedAt: latestTime,
          settlementDate: latestRows[0]?.settlementDate ?? null,
          settlementPeriod: latestRows[0]?.settlementPeriod ?? null,
          providers: latestRows.map((row) => ({
            id: row.dataProvider,
            price: row.price,
            volume: row.volume,
          })),
        },
        latestDataTimestamp: latestTime,
      };
    },
  });
}

export async function getElexonDemand(options = {}) {
  const now = options.now ?? new Date();
  const fetcher = options.fetcher ?? fetchJson;
  const { from, to } = trailingWindow(now, 6);
  const endpoint = `${BASE_URL}/datasets/ITSDO?publishDateTimeFrom=${encodeURIComponent(from)}&publishDateTimeTo=${encodeURIComponent(to)}&format=json`;

  return runConnector({
    source: sourceMeta("elexon-itsdo", "Initial Transmission System Demand Outturn", endpoint),
    attemptedAt: new Date().toISOString(),
    fetcher,
    endpoint,
    normalize(data) {
      const rows = Array.isArray(data?.data) ? data.data : [];
      const validRows = rows
        .map(normalizeDemandRow)
        .filter(Boolean)
        .sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));

      if (!validRows.length) throw new Error("invalid_elexon_itsdo_payload");
      const latest = validRows.at(-1);

      return {
        metric: {
          region: "GB",
          code: "transmission_system_demand",
          value: latest.value,
          unit: "MW",
          observedAt: latest.observedAt,
          settlementDate: latest.settlementDate,
          settlementPeriod: latest.settlementPeriod,
        },
        latestDataTimestamp: latest.observedAt,
      };
    },
  });
}

export function normalizeMarketPriceRow(row) {
  const price = finiteNumber(row?.price);
  const volume = finiteNumber(row?.volume);
  const observedAt = validIso(row?.startTime);
  if (price === null || volume === null || !observedAt) return null;

  return {
    observedAt,
    price,
    volume,
    dataProvider: String(row?.dataProvider || "unknown"),
    settlementDate: row?.settlementDate ?? null,
    settlementPeriod: integerOrNull(row?.settlementPeriod),
  };
}

export function normalizeDemandRow(row) {
  const value = finiteNumber(row?.demand);
  const observedAt = validIso(row?.startTime ?? row?.publishTime);
  if (value === null || !observedAt) return null;

  return {
    observedAt,
    value,
    settlementDate: row?.settlementDate ?? null,
    settlementPeriod: integerOrNull(row?.settlementPeriod),
  };
}

export function volumeWeightedPrice(rows) {
  const usable = rows.filter((row) => Number.isFinite(row.price) && Number.isFinite(row.volume) && row.volume > 0);
  const volume = usable.reduce((sum, row) => sum + row.volume, 0);
  if (!volume) return usable.at(-1)?.price ?? null;
  return usable.reduce((sum, row) => sum + row.price * row.volume, 0) / volume;
}

async function runConnector({ source, attemptedAt, fetcher, endpoint, normalize }) {
  try {
    const { data, latencyMs, fetchedAt } = await fetcher(endpoint);
    const normalized = normalize(data);
    return {
      source,
      metric: normalized.metric,
      health: {
        status: "operational",
        lastAttemptAt: attemptedAt,
        lastSuccessAt: fetchedAt,
        latencyMs,
        latestDataTimestamp: normalized.latestDataTimestamp,
        stale: isStale(normalized.latestDataTimestamp, 3 * 60 * 60 * 1000),
        lastError: null,
      },
    };
  } catch (error) {
    return {
      source,
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

function sourceMeta(id, dataset, endpoint) {
  return {
    id,
    provider: "Elexon",
    dataset,
    endpoint,
    licence: LICENCE,
  };
}

function trailingWindow(now, hours) {
  const end = new Date(now);
  const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
  return { from: start.toISOString(), to: end.toISOString() };
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function integerOrNull(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function validIso(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}

function isStale(timestamp, maxAgeMs) {
  const parsed = Date.parse(timestamp || "");
  if (!Number.isFinite(parsed)) return true;
  return Date.now() - parsed > maxAgeMs;
}
