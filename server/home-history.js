import { database } from "./database.js";
import { getAccountSession } from "./auth.js";
import { ensureHomeSchema } from "./home-schema.js";

export async function readHomeHistory(request, response) {
  await ensureHomeSchema();
  const context = await historyContext(request);
  if (!context) return response.status(401).json({ authenticated: false });
  if (!context.site) return response.status(404).json({ error: "home_site_not_found" });

  const days = clampInteger(request.query?.days, 1, 90, 30);
  const sql = database();
  const siteId = context.site.id;

  const [daily, hourly, summaryRows, tariffRows] = await Promise.all([
    sql`
      select
        date_trunc('day', interval_start) as day,
        coalesce(sum(quantity_kwh) filter (where fuel = 'electricity' and direction = 'import'), 0)::double precision as electricity_import_kwh,
        coalesce(sum(quantity_kwh) filter (where fuel = 'electricity' and direction in ('export','generation')), 0)::double precision as electricity_export_kwh,
        coalesce(sum(quantity_kwh) filter (where fuel = 'gas'), 0)::double precision as gas_kwh
      from cobra_home_interval_readings
      where site_id = ${siteId}
        and interval_start >= now() - (${days}::text || ' days')::interval
      group by 1
      order by 1 asc
    `,
    sql`
      select
        extract(hour from interval_start at time zone 'Europe/London')::integer as hour,
        coalesce(sum(quantity_kwh), 0)::double precision as electricity_import_kwh,
        count(*)::integer as reading_count
      from cobra_home_interval_readings
      where site_id = ${siteId}
        and fuel = 'electricity'
        and direction = 'import'
        and interval_start >= now() - (${days}::text || ' days')::interval
      group by 1
      order by 1 asc
    `,
    sql`
      select
        count(*)::integer as reading_count,
        count(distinct date_trunc('day', interval_start at time zone 'Europe/London'))::integer as covered_days,
        coalesce(sum(quantity_kwh) filter (where fuel = 'electricity' and direction = 'import'), 0)::double precision as electricity_import_kwh,
        coalesce(sum(quantity_kwh) filter (where fuel = 'electricity' and direction in ('export','generation')), 0)::double precision as electricity_export_kwh,
        coalesce(sum(quantity_kwh) filter (where fuel = 'gas'), 0)::double precision as gas_kwh,
        coalesce(sum(quantity_kwh) filter (
          where fuel = 'electricity' and direction = 'import'
            and extract(hour from interval_start at time zone 'Europe/London') between 0 and 4
        ), 0)::double precision as overnight_kwh,
        coalesce(sum(quantity_kwh) filter (
          where fuel = 'electricity' and direction = 'import'
            and extract(hour from interval_start at time zone 'Europe/London') between 16 and 20
        ), 0)::double precision as evening_kwh,
        coalesce(max(quantity_kwh * 60.0 / nullif(interval_minutes, 0)) filter (
          where fuel = 'electricity' and direction = 'import'
        ), 0)::double precision as peak_kw,
        min(interval_start) as first_interval_at,
        max(interval_start) as latest_interval_at
      from cobra_home_interval_readings
      where site_id = ${siteId}
        and interval_start >= now() - (${days}::text || ' days')::interval
    `,
    sql`
      select id, tariff_name, rate_type, unit_rate_p_per_kwh, standing_charge_p_per_day, currency, valid_from, valid_to
      from cobra_home_tariffs
      where site_id = ${siteId} and fuel = 'electricity'
      order by valid_from desc nulls last, created_at desc
      limit 1
    `,
  ]);

  const raw = summaryRows[0] || {};
  const coveredDays = Number(raw.covered_days || 0);
  const importKwh = Number(raw.electricity_import_kwh || 0);
  const overnightKwh = Number(raw.overnight_kwh || 0);
  const eveningKwh = Number(raw.evening_kwh || 0);
  const tariff = tariffRows[0] || null;
  const flatRate = tariff?.rate_type === 'flat' && tariff.unit_rate_p_per_kwh != null
    ? Number(tariff.unit_rate_p_per_kwh)
    : null;
  const standing = tariff?.standing_charge_p_per_day != null ? Number(tariff.standing_charge_p_per_day) : null;

  const estimatedEnergyCostGbp = flatRate == null ? null : importKwh * flatRate / 100;
  const estimatedStandingCostGbp = standing == null || !coveredDays ? null : coveredDays * standing / 100;
  const estimatedTotalCostGbp = estimatedEnergyCostGbp == null
    ? null
    : estimatedEnergyCostGbp + (estimatedStandingCostGbp || 0);

  const hourlyTotal = hourly.reduce((sum, row) => sum + Number(row.electricity_import_kwh || 0), 0);
  const hourlyProfile = hourly.map((row) => ({
    hour: Number(row.hour),
    electricityImportKwh: Number(row.electricity_import_kwh || 0),
    share: hourlyTotal > 0 ? Number(row.electricity_import_kwh || 0) / hourlyTotal : 0,
  }));

  return response.status(200).json({
    authenticated: true,
    site: context.site,
    windowDays: days,
    source: 'cobra_home_interval_readings',
    daily: daily.map((row) => ({
      day: row.day,
      electricityImportKwh: Number(row.electricity_import_kwh || 0),
      electricityExportKwh: Number(row.electricity_export_kwh || 0),
      gasKwh: Number(row.gas_kwh || 0),
    })),
    hourlyProfile,
    tariff,
    summary: {
      readingCount: Number(raw.reading_count || 0),
      coveredDays,
      firstIntervalAt: raw.first_interval_at || null,
      latestIntervalAt: raw.latest_interval_at || null,
      electricityImportKwh: importKwh,
      electricityExportKwh: Number(raw.electricity_export_kwh || 0),
      gasKwh: Number(raw.gas_kwh || 0),
      averageDailyElectricityKwh: coveredDays ? importKwh / coveredDays : 0,
      peakKw: Number(raw.peak_kw || 0),
      overnightKwh,
      overnightShare: importKwh > 0 ? overnightKwh / importKwh : 0,
      eveningKwh,
      eveningShare: importKwh > 0 ? eveningKwh / importKwh : 0,
      estimatedEnergyCostGbp,
      estimatedStandingCostGbp,
      estimatedTotalCostGbp,
      costMethod: flatRate == null ? null : 'flat_tariff_estimate',
    },
  });
}

async function historyContext(request) {
  const session = await getAccountSession(request);
  if (!session) return null;
  const requestedSiteId = cleanOptional(request.query?.siteId, 120);
  const site = requestedSiteId
    ? (session.sites || []).find((entry) => entry.id === requestedSiteId && entry.product === 'home')
    : (session.sites || []).find((entry) => entry.product === 'home');
  return { session, site: site || null };
}

function cleanOptional(value, maxLength) {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, maxLength) : null;
}

function clampInteger(value, minimum, maximum, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(maximum, Math.max(minimum, number));
}
