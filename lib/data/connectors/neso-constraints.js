import { fetchJson } from "../http.js";

const RESOURCE_ID = "4136a8e2-07c5-4784-8096-28999447a16e";
const ENDPOINT = `https://api.neso.energy/api/3/action/datastore_search?resource_id=${RESOURCE_ID}&limit=30&sort=Date%20desc`;

export async function getNesoConstraints(options = {}) {
  const fetcher = options.fetcher ?? fetchJson;
  const attemptedAt = new Date().toISOString();

  try {
    const { data, latencyMs, fetchedAt } = await fetcher(ENDPOINT);
    const records = Array.isArray(data?.result?.records) ? data.result.records : [];
    if (!records.length) throw new Error("invalid_neso_constraints_payload");

    const latestDate = records[0]?.Date ?? records[0]?.date ?? null;
    const sameDate = records.filter((row) => (row?.Date ?? row?.date ?? null) === latestDate);
    const totals = sameDate.reduce(
      (acc, row) => {
        acc.costGbp += sumMatchingFields(row, /cost/i);
        acc.volumeMwh += sumMatchingFields(row, /volume/i);
        return acc;
      },
      { costGbp: 0, volumeMwh: 0 },
    );

    const observedAt = validDate(latestDate) ?? fetchedAt;

    return {
      source: {
        id: "neso-constraint-breakdown",
        provider: "National Energy System Operator",
        dataset: "Constraint Breakdown Costs and Volume 2026-2027",
        endpoint: ENDPOINT,
        licence: "NESO Open Data Licence",
      },
      metric: {
        region: "GB",
        code: "constraint_activity",
        value: totals.costGbp,
        unit: "GBP/day",
        observedAt,
        constraintCostGbp: totals.costGbp,
        constraintVolumeMwh: totals.volumeMwh,
        records: sameDate.length,
        sourceDate: latestDate,
      },
      health: {
        status: "operational",
        lastAttemptAt: attemptedAt,
        lastSuccessAt: fetchedAt,
        latencyMs,
        latestDataTimestamp: observedAt,
        stale: Date.now() - Date.parse(observedAt) > 14 * 24 * 60 * 60 * 1000,
        lastError: null,
      },
    };
  } catch (error) {
    return {
      source: {
        id: "neso-constraint-breakdown",
        provider: "National Energy System Operator",
        dataset: "Constraint Breakdown Costs and Volume 2026-2027",
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

function sumMatchingFields(row, matcher) {
  let total = 0;
  for (const [key, value] of Object.entries(row || {})) {
    if (!matcher.test(key)) continue;
    const number = Number(String(value ?? "").replace(/[,£]/g, ""));
    if (Number.isFinite(number)) total += number;
  }
  return total;
}

function validDate(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}
