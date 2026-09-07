import { fetchJson } from "../http.js";

const BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1";
const LICENCE = "BMRS Data Licence";

export async function getElexonSystemPrice(options = {}) {
  const now = options.now ?? new Date();
  const fetcher = options.fetcher ?? fetchJson;
  const settlementDate = isoDate(now);
  const endpoint = `${BASE_URL}/balancing/settlement/system-prices/${settlementDate}`;
  return runConnector({
    id: "elexon-system-price",
    dataset: "Settlement System Prices",
    endpoint,
    fetcher,
    normalize(data) {
      const rows = rowsFrom(data).map(normalizeSystemPriceRow).filter(Boolean);
      if (!rows.length) throw new Error("invalid_elexon_system_price_payload");
      rows.sort((a, b) => a.settlementPeriod - b.settlementPeriod);
      const latest = latestCompletedPeriod(rows, now) ?? rows.at(-1);
      return {
        metric: {
          region: "GB",
          code: "system_imbalance_price",
          value: latest.systemBuyPrice ?? latest.systemSellPrice,
          unit: "GBP/MWh",
          observedAt: settlementPeriodTime(settlementDate, latest.settlementPeriod),
          settlementDate,
          settlementPeriod: latest.settlementPeriod,
          systemBuyPrice: latest.systemBuyPrice,
          systemSellPrice: latest.systemSellPrice,
        },
        latestDataTimestamp: settlementPeriodTime(settlementDate, latest.settlementPeriod),
      };
    },
  });
}

export async function getElexonSurplus(options = {}) {
  const now = options.now ?? new Date();
  const fetcher = options.fetcher ?? fetchJson;
  const { from, to } = trailingWindow(now, 24);
  const endpoint = `${BASE_URL}/datasets/OCNMFD?publishDateTimeFrom=${encodeURIComponent(from)}&publishDateTimeTo=${encodeURIComponent(to)}&format=json`;
  return runConnector({
    id: "elexon-ocnmfd",
    dataset: "2-14 Days Ahead Demand Surplus Forecast",
    endpoint,
    fetcher,
    normalize(data) {
      const rows = rowsFrom(data).map(normalizeSurplusRow).filter(Boolean);
      if (!rows.length) throw new Error("invalid_elexon_ocnmfd_payload");
      rows.sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));
      const latest = rows.at(-1);
      return {
        metric: {
          region: "GB",
          code: "forecast_surplus",
          value: latest.valueMw,
          unit: "MW",
          observedAt: latest.observedAt,
          forecastDate: latest.forecastDate,
        },
        latestDataTimestamp: latest.observedAt,
      };
    },
  });
}

export function normalizeSystemPriceRow(row) {
  const settlementPeriod = integerOrNull(row?.settlementPeriod ?? row?.period);
  const systemBuyPrice = firstFinite(row?.systemBuyPrice, row?.buyPrice, row?.sbp, row?.price);
  const systemSellPrice = firstFinite(row?.systemSellPrice, row?.sellPrice, row?.ssp, row?.price);
  if (!settlementPeriod || (systemBuyPrice === null && systemSellPrice === null)) return null;
  return { settlementPeriod, systemBuyPrice, systemSellPrice };
}

export function normalizeSurplusRow(row) {
  const valueMw = firstFinite(row?.surplus, row?.surplusMw, row?.quantity, row?.value);
  const observedAt = validIso(row?.publishTime ?? row?.publishDateTime ?? row?.startTime ?? row?.timestamp);
  if (valueMw === null || !observedAt) return null;
  return {
    valueMw,
    observedAt,
    forecastDate: row?.forecastDate ?? row?.date ?? null,
  };
}

async function runConnector({ id, dataset, endpoint, fetcher, normalize }) {
  const attemptedAt = new Date().toISOString();
  const source = { id, provider: "Elexon", dataset, endpoint, licence: LICENCE };
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
        stale: isPastStale(normalized.latestDataTimestamp),
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

function rowsFrom(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function latestCompletedPeriod(rows, now) {
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const completedPeriod = Math.max(1, Math.floor(minutes / 30));
  return rows.filter((row) => row.settlementPeriod <= completedPeriod).at(-1) ?? null;
}

function settlementPeriodTime(date, period) {
  const base = Date.parse(`${date}T00:00:00Z`);
  return new Date(base + (Number(period) - 1) * 30 * 60 * 1000).toISOString();
}

function isoDate(value) {
  return new Date(value).toISOString().slice(0, 10);
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

function isPastStale(timestamp) {
  const parsed = Date.parse(timestamp || "");
  if (!Number.isFinite(parsed)) return true;
  return Date.now() - parsed > 12 * 60 * 60 * 1000;
}
