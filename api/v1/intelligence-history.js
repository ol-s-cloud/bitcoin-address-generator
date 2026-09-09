import { database, databaseConfigured } from "../../server/database.js";

export default async function handler(request, response) {
  if (!databaseConfigured()) return response.status(503).json({ error: "database_unavailable" });
  const query = request?.query || {};
  const siteId = String(query.siteId || "gb-demo-site").trim();
  const assetId = String(query.assetId || "").trim();
  const hours = Math.max(1, Math.min(24 * 90, Number(query.hours) || 24 * 30));
  const limit = Math.max(1, Math.min(2000, Number(query.limit) || 500));
  const since = new Date(Date.now() - hours * 3600_000).toISOString();
  const sql = database();

  try {
    const rows = assetId
      ? await sql`
          select checked_at, country, site_id, site_name, asset_id, asset_model, units,
                 tariff_pence_kwh, action, condition, confidence_score,
                 break_even_pence_kwh, headroom_pence_kwh, headroom_pct,
                 revenue_gbp_day, electricity_cost_gbp_day, net_contribution_gbp_day
          from cobra_intelligence_decisions
          where site_id = ${siteId} and asset_id = ${assetId} and checked_at >= ${since}
          order by checked_at desc limit ${limit}
        `
      : await sql`
          select checked_at, country, site_id, site_name, asset_id, asset_model, units,
                 tariff_pence_kwh, action, condition, confidence_score,
                 break_even_pence_kwh, headroom_pence_kwh, headroom_pct,
                 revenue_gbp_day, electricity_cost_gbp_day, net_contribution_gbp_day
          from cobra_intelligence_decisions
          where site_id = ${siteId} and checked_at >= ${since}
          order by checked_at desc limit ${limit}
        `;

    const observations = rows.map((row) => ({
      checkedAt: row.checked_at,
      country: row.country,
      siteId: row.site_id,
      siteName: row.site_name,
      assetId: row.asset_id,
      assetModel: row.asset_model,
      units: Number(row.units),
      tariffPenceKwh: number(row.tariff_pence_kwh),
      action: row.action,
      condition: row.condition,
      confidenceScore: Number(row.confidence_score),
      breakEvenPenceKwh: number(row.break_even_pence_kwh),
      headroomPenceKwh: number(row.headroom_pence_kwh),
      headroomPct: number(row.headroom_pct),
      revenueGbpDay: number(row.revenue_gbp_day),
      electricityCostGbpDay: number(row.electricity_cost_gbp_day),
      netContributionGbpDay: number(row.net_contribution_gbp_day),
      profitable: number(row.net_contribution_gbp_day) > 0,
    }));

    const profitable = observations.filter((row) => row.profitable).length;
    const strongOrFavourable = observations.filter((row) => row.condition === "STRONG" || row.condition === "FAVOURABLE").length;
    const averageNet = observations.length
      ? observations.reduce((sum, row) => sum + (row.netContributionGbpDay || 0), 0) / observations.length
      : null;

    response.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    return response.status(200).json({
      product: "COBRA Intelligence History",
      siteId,
      assetId: assetId || null,
      windowHours: hours,
      samples: observations.length,
      summary: {
        profitableSamples: profitable,
        profitableSharePct: observations.length ? profitable / observations.length * 100 : null,
        strongOrFavourableSamples: strongOrFavourable,
        averageNetContributionGbpDay: averageNet,
      },
      observations,
    });
  } catch (error) {
    const message = String(error?.message || "history_failed");
    if (/cobra_intelligence_decisions/i.test(message) && /does not exist/i.test(message)) {
      return response.status(200).json({
        product: "COBRA Intelligence History",
        siteId,
        assetId: assetId || null,
        windowHours: hours,
        samples: 0,
        summary: { profitableSamples: 0, profitableSharePct: null, strongOrFavourableSamples: 0, averageNetContributionGbpDay: null },
        observations: [],
      });
    }
    return response.status(500).json({ error: message });
  }
}

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
