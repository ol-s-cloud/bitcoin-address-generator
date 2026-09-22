import { database, databaseConfigured, ensureSchema } from "../../server/database.js";

export async function persistObservations(connectorResults) {
  if (!databaseConfigured()) {
    return { enabled: false, saved: 0, skipped: connectorResults.length };
  }

  await ensureSchema();
  const sql = database();
  let saved = 0;
  let skipped = 0;

  for (const result of connectorResults) {
    const observation = observationFromConnector(result);
    if (!observation) {
      skipped += 1;
      continue;
    }

    const rows = await sql`
      insert into cobra_data_observations (
        source_id,
        metric_code,
        region,
        observed_at,
        value,
        unit,
        payload
      ) values (
        ${observation.sourceId},
        ${observation.metricCode},
        ${observation.region},
        ${observation.observedAt},
        ${observation.value},
        ${observation.unit},
        ${JSON.stringify(observation.payload)}::jsonb
      )
      on conflict (source_id, metric_code, region, observed_at) do update set
        value = excluded.value,
        unit = excluded.unit,
        payload = excluded.payload,
        ingested_at = now()
      returning id
    `;
    if (rows.length) saved += 1;
  }

  return { enabled: true, saved, skipped };
}

export function observationFromConnector(result) {
  if (result?.health?.status !== "operational" || !result?.source?.id || !result?.metric?.code) {
    return null;
  }

  const observedAt =
    validTimestamp(result.metric.observedAt) ||
    validTimestamp(result.metric.validFrom) ||
    validTimestamp(result.health.latestDataTimestamp);

  if (!observedAt) return null;

  const value = finiteNumber(result.metric.value);

  return {
    sourceId: String(result.source.id),
    metricCode: String(result.metric.code),
    region: String(result.metric.region || "global"),
    observedAt,
    value,
    unit: result.metric.unit ? String(result.metric.unit) : null,
    payload: {
      source: result.source,
      metric: result.metric,
      health: {
        lastSuccessAt: result.health.lastSuccessAt,
        latencyMs: result.health.latencyMs,
        stale: result.health.stale,
      },
    },
  };
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function validTimestamp(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}
