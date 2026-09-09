import { database, databaseConfigured } from "../../server/database.js";

export async function readDecisionHistory({ siteId = "gb-demo-site", assetId = "", hours = 720, limit = 500 } = {}) {
  if (!databaseConfigured()) return { databaseAvailable: false, observations: [] };
  const sql = database();
  const safeSiteId = String(siteId || "gb-demo-site").trim();
  const safeAssetId = String(assetId || "").trim();
  const safeHours = Math.max(1, Math.min(24 * 90, Number(hours) || 720));
  const safeLimit = Math.max(1, Math.min(2000, Number(limit) || 500));
  const since = new Date(Date.now() - safeHours * 3600_000).toISOString();

  try {
    const rows = safeAssetId
      ? await sql`
          select checked_at, country, site_id, site_name, asset_id, asset_model, units,
                 tariff_pence_kwh, action, condition, confidence_score,
                 break_even_pence_kwh, headroom_pence_kwh, headroom_pct,
                 revenue_gbp_day, electricity_cost_gbp_day, net_contribution_gbp_day
          from cobra_intelligence_decisions
          where site_id = ${safeSiteId} and asset_id = ${safeAssetId} and checked_at >= ${since}
          order by checked_at desc limit ${safeLimit}
        `
      : await sql`
          select checked_at, country, site_id, site_name, asset_id, asset_model, units,
                 tariff_pence_kwh, action, condition, confidence_score,
                 break_even_pence_kwh, headroom_pence_kwh, headroom_pct,
                 revenue_gbp_day, electricity_cost_gbp_day, net_contribution_gbp_day
          from cobra_intelligence_decisions
          where site_id = ${safeSiteId} and checked_at >= ${since}
          order by checked_at desc limit ${safeLimit}
        `;

    const observations = rows.map((row) => ({
      checkedAt: row.checked_at,
      country: row.country,
      siteId: row.site_id,
      siteName: row.site_name,
      assetId: row.asset_id,
      assetModel: row.asset_model,
      units: Number(row.units),
      tariffPenceKwh: numeric(row.tariff_pence_kwh),
      action: row.action,
      condition: row.condition,
      confidenceScore: Number(row.confidence_score),
      breakEvenPenceKwh: numeric(row.break_even_pence_kwh),
      headroomPenceKwh: numeric(row.headroom_pence_kwh),
      headroomPct: numeric(row.headroom_pct),
      revenueGbpDay: numeric(row.revenue_gbp_day),
      electricityCostGbpDay: numeric(row.electricity_cost_gbp_day),
      netContributionGbpDay: numeric(row.net_contribution_gbp_day),
      profitable: numeric(row.net_contribution_gbp_day) > 0,
    }));

    const profitable = observations.filter((row) => row.profitable).length;
    const strongOrFavourable = observations.filter((row) => row.condition === "STRONG" || row.condition === "FAVOURABLE").length;
    return {
      databaseAvailable: true,
      siteId: safeSiteId,
      assetId: safeAssetId || null,
      windowHours: safeHours,
      samples: observations.length,
      summary: {
        profitableSamples: profitable,
        profitableSharePct: observations.length ? profitable / observations.length * 100 : null,
        strongOrFavourableSamples: strongOrFavourable,
        averageNetContributionGbpDay: observations.length
          ? observations.reduce((sum, row) => sum + (row.netContributionGbpDay || 0), 0) / observations.length
          : null,
      },
      observations,
    };
  } catch (error) {
    const message = String(error?.message || "history_failed");
    if (/cobra_intelligence_decisions/i.test(message) && /does not exist/i.test(message)) {
      return {
        databaseAvailable: true,
        siteId: safeSiteId,
        assetId: safeAssetId || null,
        windowHours: safeHours,
        samples: 0,
        summary: { profitableSamples: 0, profitableSharePct: null, strongOrFavourableSamples: 0, averageNetContributionGbpDay: null },
        observations: [],
      };
    }
    throw error;
  }
}

function numeric(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
