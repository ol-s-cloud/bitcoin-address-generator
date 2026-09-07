import { database, databaseConfigured, ensureSchema } from "../../server/database.js";

export async function readHistory(options = {}) {
  if (!databaseConfigured()) {
    return { enabled: false, rows: [] };
  }

  await ensureSchema();
  const sql = database();
  const metric = String(options.metric || "").trim();
  const region = String(options.region || "").trim();
  const hours = clampNumber(options.hours, 24, 1, 24 * 90);
  const limit = clampNumber(options.limit, 500, 1, 5000);
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const rows = metric && region
    ? await sql`
        select source_id, metric_code, region, observed_at, value, unit, payload, ingested_at
        from cobra_data_observations
        where metric_code = ${metric}
          and region = ${region}
          and observed_at >= ${since}
        order by observed_at asc
        limit ${limit}
      `
    : metric
      ? await sql`
          select source_id, metric_code, region, observed_at, value, unit, payload, ingested_at
          from cobra_data_observations
          where metric_code = ${metric}
            and observed_at >= ${since}
          order by observed_at asc
          limit ${limit}
        `
      : await sql`
          select source_id, metric_code, region, observed_at, value, unit, payload, ingested_at
          from cobra_data_observations
          where observed_at >= ${since}
          order by observed_at desc
          limit ${limit}
        `;

  return {
    enabled: true,
    query: { metric: metric || null, region: region || null, hours, limit },
    rows,
  };
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(number)));
}
