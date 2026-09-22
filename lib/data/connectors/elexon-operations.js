import { fetchJson } from "../http.js";

const BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1";
const LICENCE = "BMRS Data Licence";

export async function getElexonGenerationMix(options = {}) {
  const now = options.now ?? new Date();
  const fetcher = options.fetcher ?? fetchJson;
  const { from, to } = trailingWindow(now, 3);
  const endpoint = `${BASE_URL}/datasets/FUELINST?publishDateTimeFrom=${encodeURIComponent(from)}&publishDateTimeTo=${encodeURIComponent(to)}&format=json`;
  return runConnector({
    source: sourceMeta("elexon-fuelinst", "Instantaneous Generation Outturn by Fuel Type", endpoint),
    fetcher,
    endpoint,
    normalize(data) {
      const rows = Array.isArray(data?.data) ? data.data : [];
      const normalized = rows.map(normalizeFuelRow).filter(Boolean);
      if (!normalized.length) throw new Error("invalid_elexon_fuelinst_payload");
      normalized.sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));
      const latestTime = normalized.at(-1).observedAt;
      const latest = normalized.filter((row) => row.observedAt === latestTime);
      const totalMw = latest.reduce((sum, row) => sum + row.valueMw, 0);
      return {
        metric: {
          region: "GB",
          code: "generation_mix",
          value: totalMw,
          unit: "MW",
          observedAt: latestTime,
          totalGenerationMw: totalMw,
          fuels: latest.map((row) => ({ fuelType: row.fuelType, generationMw: row.valueMw })),
        },
        latestDataTimestamp: latestTime,
      };
    },
  });
}

export async function getElexonIndicatedMargin(options = {}) {
  const now = options.now ?? new Date();
  const fetcher = options.fetcher ?? fetchJson;
  const { from, to } = trailingWindow(now, 12);
  const endpoint = `${BASE_URL}/datasets/MELNGC?publishDateTimeFrom=${encodeURIComponent(from)}&publishDateTimeTo=${encodeURIComponent(to)}&format=json`;
  return runConnector({
    source: sourceMeta("elexon-melngc", "Day and Day-Ahead Indicated Margin", endpoint),
    fetcher,
    endpoint,
    normalize(data) {
      const rows = Array.isArray(data?.data) ? data.data : [];
      const normalized = rows.map(normalizeMarginRow).filter(Boolean);
      if (!normalized.length) throw new Error("invalid_elexon_melngc_payload");
      normalized.sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));
      const latest = normalized.at(-1);
      return {
        metric: {
          region: "GB",
          code: "indicated_margin",
          value: latest.valueMw,
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

export function normalizeFuelRow(row) {
  const valueMw = firstFinite(row?.currentUsage, row?.generation, row?.quantity, row?.value);
  const fuelType = row?.fuelType ?? row?.fuelTypeCode ?? row?.fuel ?? row?.type;
  const observedAt = validIso(row?.startTime ?? row?.publishTime ?? row?.publishDateTime ?? row?.timestamp);
  if (valueMw === null || !fuelType || !observedAt) return null;
  return { fuelType: String(fuelType), valueMw, observedAt };
}

export function normalizeMarginRow(row) {
  const valueMw = firstFinite(row?.margin, row?.indicatedMargin, row?.quantity, row?.value);
  const observedAt = validIso(row?.startTime ?? row?.publishTime ?? row?.publishDateTime ?? row?.timestamp);
  if (valueMw === null || !observedAt) return null;
  return {
    valueMw,
    observedAt,
    settlementDate: row?.settlementDate ?? null,
    settlementPeriod: integerOrNull(row?.settlementPeriod),
  };
}

async function runConnector({ source, fetcher, endpoint, normalize }) {
  const attemptedAt = new Date().toISOString();
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
        stale: Date.now() - Date.parse(normalized.latestDataTimestamp) > 6 * 60 * 60 * 1000,
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
  return { id, provider: "Elexon", dataset, endpoint, licence: LICENCE };
}

function trailingWindow(now, hours) {
  const end = new Date(now);
  const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
  return { from: start.toISOString(), to: end.toISOString() };
}

function firstFinite(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function integerOrNull(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function validIso(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}
