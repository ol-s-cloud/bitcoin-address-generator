import { randomUUID } from "node:crypto";
import { database } from "./database.js";
import { getAccountSession } from "./auth.js";
import { ensureHomeSchema } from "./home-schema.js";

const CONNECTION_TYPES = new Set(["octopus", "smart_meter", "csv", "manual", "device_gateway", "manufacturer_api"]);
const SOURCE_TYPES = new Set(["manual", "octopus", "smart_meter", "csv", "device_gateway"]);
const CONNECTIVITY = new Set(["none", "manual", "matter", "mqtt", "home_assistant", "manufacturer_api", "cobra"]);
const ASSET_TYPES = new Set(["solar", "battery", "ev", "ev_charger", "heat_pump", "wind", "generator", "other"]);
const RATE_TYPES = new Set(["flat", "tou", "dynamic", "unknown"]);
const FUELS = new Set(["electricity", "gas"]);
const DIRECTIONS = new Set(["import", "export", "generation"]);

export async function readHomeSnapshot(request, response) {
  await ensureHomeSchema();
  const context = await homeContext(request);
  if (!context) return response.status(401).json({ authenticated: false });
  if (!context.site) return response.status(404).json({ error: "home_site_not_found" });

  const sql = database();
  const siteId = context.site.id;
  const [energyAccounts, connections, meters, tariffs, tariffRates, bills, appliances, assets, opportunities, readingStats] = await Promise.all([
    sql`
      select id, supplier, account_label, source_type, connection_status,
             external_account_ref_masked, is_primary, metadata, created_at, updated_at
      from cobra_home_energy_accounts
      where site_id = ${siteId}
      order by is_primary desc, created_at desc
    `,
    sql`
      select id, energy_account_id, connection_type, provider, status,
             external_reference_masked, permissions, metadata, last_sync_at, created_at, updated_at
      from cobra_home_connections
      where site_id = ${siteId}
      order by created_at desc
    `,
    sql`
      select id, energy_account_id, fuel, direction, identifier_masked, serial_masked,
             interval_minutes, status, metadata, created_at, updated_at
      from cobra_home_meters
      where site_id = ${siteId}
      order by fuel, direction, created_at desc
    `,
    sql`
      select id, energy_account_id, fuel, supplier, tariff_name, product_code,
             rate_type, currency, unit_rate_p_per_kwh, standing_charge_p_per_day,
             valid_from, valid_to, source, metadata, created_at, updated_at
      from cobra_home_tariffs
      where site_id = ${siteId}
      order by valid_from desc nulls last, created_at desc
      limit 20
    `,
    sql`
      select id, tariff_id, direction, rate_label, value_p_per_kwh,
             valid_from, valid_to, source, metadata, created_at
      from cobra_home_tariff_rates
      where site_id = ${siteId}
      order by valid_from desc nulls last, created_at desc
      limit 100
    `,
    sql`
      select id, energy_account_id, supplier, bill_reference_masked, period_start,
             period_end, currency, total_amount, energy_charge, standing_charge,
             tax_amount, electricity_kwh, gas_kwh, source, metadata, created_at, updated_at
      from cobra_home_bills
      where site_id = ${siteId}
      order by period_end desc nulls last, created_at desc
      limit 24
    `,
    sql`
      select id, category, name, manufacturer, model, gtin, rated_power_w,
             annual_energy_kwh, energy_per_cycle_kwh, flexible, connectivity, spec_source,
             spec_verified, metadata, created_at, updated_at
      from cobra_home_appliances
      where site_id = ${siteId}
      order by created_at desc
      limit 50
    `,
    sql`
      select id, asset_type, name, manufacturer, model, capacity_kw,
             capacity_kwh, connectivity, metadata, created_at, updated_at
      from cobra_home_assets
      where site_id = ${siteId}
      order by created_at desc
      limit 50
    `,
    sql`
      select id, opportunity_type, title, description, annual_value_gbp,
             confidence, status, assumptions, evidence, created_at, updated_at
      from cobra_home_opportunities
      where site_id = ${siteId} and status = 'open'
      order by annual_value_gbp desc nulls last, created_at desc
      limit 25
    `,
    sql`
      select
        count(*)::integer as interval_count,
        max(interval_start) as latest_interval_at,
        coalesce(sum(quantity_kwh) filter (
          where fuel = 'electricity'
            and direction = 'import'
            and interval_start >= date_trunc('month', now())
        ), 0)::double precision as electricity_import_kwh_month,
        coalesce(sum(quantity_kwh) filter (
          where fuel = 'electricity'
            and direction in ('export', 'generation')
            and interval_start >= date_trunc('month', now())
        ), 0)::double precision as electricity_export_kwh_month,
        coalesce(sum(quantity_kwh) filter (
          where fuel = 'gas'
            and interval_start >= date_trunc('month', now())
        ), 0)::double precision as gas_kwh_month
      from cobra_home_interval_readings
      where site_id = ${siteId}
    `,
  ]);

  const stats = readingStats[0] || {};
  return response.status(200).json({
    authenticated: true,
    user: context.session.user,
    site: context.site,
    product: context.product || null,
    energyAccounts,
    connections,
    meters,
    tariffs,
    tariffRates,
    bills,
    appliances,
    assets,
    opportunities,
    summary: {
      energyAccountConnected: energyAccounts.some((entry) => entry.connection_status === "connected"),
      smartMeterConnected: meters.length > 0 && connections.some((entry) => ["smart_meter", "octopus", "device_gateway"].includes(entry.connection_type) && entry.status === "connected"),
      intervalCount: Number(stats.interval_count || 0),
      latestIntervalAt: stats.latest_interval_at || null,
      electricityImportKwhMonth: Number(stats.electricity_import_kwh_month || 0),
      electricityExportKwhMonth: Number(stats.electricity_export_kwh_month || 0),
      gasKwhMonth: Number(stats.gas_kwh_month || 0),
      applianceCount: appliances.length,
      assetCount: assets.length,
      openOpportunityCount: opportunities.length,
      latestBill: bills[0] || null,
    },
  });
}

export async function handleHomePost(request, response, body) {
  await ensureHomeSchema();
  const context = await homeContext(request, body?.siteId);
  if (!context) return response.status(401).json({ authenticated: false });
  if (!context.site) return response.status(404).json({ error: "home_site_not_found" });

  const action = String(body?.action || "");
  if (action === "home_energy_account_upsert") return upsertEnergyAccount(context, body, response);
  if (action === "home_tariff_add") return addTariff(context, body, response);
  if (action === "home_bill_add") return addBill(context, body, response);
  if (action === "home_interval_import") return importIntervals(context, body, response);
  if (action === "home_appliance_add") return addAppliance(context, body, response);
  if (action === "home_appliance_update") return updateAppliance(context, body, response);
  if (action === "home_appliance_delete") return deleteAppliance(context, body, response);
  if (action === "home_asset_add") return addAsset(context, body, response);
  if (action === "home_asset_delete") return deleteAsset(context, body, response);
  return response.status(400).json({ error: "unsupported_home_action" });
}

async function upsertEnergyAccount(context, body, response) {
  const allowed = new Set(["action", "siteId", "supplier", "accountLabel", "sourceType", "connectionType"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) return response.status(400).json({ error: "unsupported_field" });

  const supplier = cleanOptional(body.supplier, 120);
  const accountLabel = cleanOptional(body.accountLabel, 120);
  const sourceType = SOURCE_TYPES.has(body.sourceType) ? body.sourceType : "manual";
  const connectionType = CONNECTION_TYPES.has(body.connectionType)
    ? body.connectionType
    : sourceType === "octopus" ? "octopus" : "manual";
  const sql = database();
  const existing = await sql`
    select id from cobra_home_energy_accounts
    where site_id = ${context.site.id} and is_primary = true
    limit 1
  `;
  const energyAccountId = existing[0]?.id || `hea_${randomUUID()}`;

  if (existing.length) {
    await sql`
      update cobra_home_energy_accounts
      set supplier = ${supplier}, account_label = ${accountLabel}, source_type = ${sourceType}, updated_at = now()
      where id = ${energyAccountId}
    `;
  } else {
    await sql`
      insert into cobra_home_energy_accounts (id, site_id, supplier, account_label, source_type, is_primary)
      values (${energyAccountId}, ${context.site.id}, ${supplier}, ${accountLabel}, ${sourceType}, true)
    `;
  }

  const connections = await sql`
    select id from cobra_home_connections
    where site_id = ${context.site.id}
      and energy_account_id = ${energyAccountId}
      and connection_type = ${connectionType}
    limit 1
  `;
  if (!connections.length) {
    await sql`
      insert into cobra_home_connections (
        id, site_id, energy_account_id, connection_type, provider, status
      ) values (
        ${`hcn_${randomUUID()}`}, ${context.site.id}, ${energyAccountId}, ${connectionType}, ${supplier}, 'pending'
      )
    `;
  }

  return response.status(200).json({ recorded: true, siteId: context.site.id, energyAccountId });
}

async function addTariff(context, body, response) {
  const allowed = new Set([
    "action", "siteId", "fuel", "supplier", "tariffName", "productCode", "rateType",
    "unitRatePPerKwh", "standingChargePPerDay", "validFrom", "validTo", "source",
  ]);
  if (Object.keys(body).some((key) => !allowed.has(key))) return response.status(400).json({ error: "unsupported_field" });

  const fuel = FUELS.has(body.fuel) ? body.fuel : null;
  if (!fuel) return response.status(400).json({ error: "invalid_fuel" });
  const energyAccountId = await primaryEnergyAccountId(context.site.id);
  const id = `htr_${randomUUID()}`;
  const sql = database();
  await sql`
    insert into cobra_home_tariffs (
      id, site_id, energy_account_id, fuel, supplier, tariff_name, product_code,
      rate_type, unit_rate_p_per_kwh, standing_charge_p_per_day,
      valid_from, valid_to, source
    ) values (
      ${id}, ${context.site.id}, ${energyAccountId}, ${fuel}, ${cleanOptional(body.supplier, 120)},
      ${cleanOptional(body.tariffName, 180)}, ${cleanOptional(body.productCode, 180)},
      ${RATE_TYPES.has(body.rateType) ? body.rateType : "unknown"},
      ${numericOrNull(body.unitRatePPerKwh, -1000, 10000)},
      ${numericOrNull(body.standingChargePPerDay, 0, 10000)},
      ${dateOrNull(body.validFrom)}, ${dateOrNull(body.validTo)}, ${cleanOptional(body.source, 120) || "manual"}
    )
  `;
  return response.status(201).json({ recorded: true, siteId: context.site.id, tariffId: id });
}

async function addBill(context, body, response) {
  const allowed = new Set([
    "action", "siteId", "supplier", "periodStart", "periodEnd", "totalAmount",
    "electricityKwh", "gasKwh", "energyCharge", "standingCharge", "taxAmount", "source",
  ]);
  if (Object.keys(body).some((key) => !allowed.has(key))) return response.status(400).json({ error: "unsupported_field" });

  const energyAccountId = await primaryEnergyAccountId(context.site.id);
  const id = `hbl_${randomUUID()}`;
  const sql = database();
  await sql`
    insert into cobra_home_bills (
      id, site_id, energy_account_id, supplier, period_start, period_end,
      total_amount, electricity_kwh, gas_kwh, energy_charge, standing_charge,
      tax_amount, source
    ) values (
      ${id}, ${context.site.id}, ${energyAccountId}, ${cleanOptional(body.supplier, 120)},
      ${dateOnlyOrNull(body.periodStart)}, ${dateOnlyOrNull(body.periodEnd)},
      ${numericOrNull(body.totalAmount, -1000000, 1000000)},
      ${numericOrNull(body.electricityKwh, 0, 10000000)}, ${numericOrNull(body.gasKwh, 0, 10000000)},
      ${numericOrNull(body.energyCharge, -1000000, 1000000)}, ${numericOrNull(body.standingCharge, -1000000, 1000000)},
      ${numericOrNull(body.taxAmount, -1000000, 1000000)}, ${cleanOptional(body.source, 120) || "manual"}
    )
  `;
  return response.status(201).json({ recorded: true, siteId: context.site.id, billId: id });
}

async function importIntervals(context, body, response) {
  const allowed = new Set(["action", "siteId", "fuel", "direction", "rows"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) return response.status(400).json({ error: "unsupported_field" });
  const fuel = FUELS.has(body.fuel) ? body.fuel : null;
  const direction = DIRECTIONS.has(body.direction) ? body.direction : null;
  const rows = Array.isArray(body.rows) ? body.rows.slice(0, 24) : [];
  if (!fuel || !direction || !rows.length) return response.status(400).json({ error: "invalid_interval_batch" });

  const normalized = rows.map((row) => {
    const intervalStart = dateOrNull(row?.intervalStart);
    const quantityKwh = numericOrNull(row?.quantityKwh, 0, 1000000);
    const intervalMinutes = numericOrNull(row?.intervalMinutes, 1, 1440) || 30;
    return intervalStart && quantityKwh !== null ? { intervalStart, quantityKwh, intervalMinutes } : null;
  }).filter(Boolean);
  if (!normalized.length) return response.status(400).json({ error: "invalid_interval_batch" });

  const sql = database();
  const energyAccountId = await primaryEnergyAccountId(context.site.id);
  const existingMeter = await sql`
    select id from cobra_home_meters
    where site_id = ${context.site.id} and fuel = ${fuel} and direction = ${direction}
    order by created_at asc
    limit 1
  `;
  const meterId = existingMeter[0]?.id || `hmr_${randomUUID()}`;
  if (!existingMeter.length) {
    await sql`
      insert into cobra_home_meters (id, site_id, energy_account_id, fuel, direction, interval_minutes, status, metadata)
      values (${meterId}, ${context.site.id}, ${energyAccountId}, ${fuel}, ${direction}, 30, 'active', ${JSON.stringify({ source: "csv" })}::jsonb)
    `;
  }

  for (const row of normalized) {
    await sql`
      insert into cobra_home_interval_readings (
        site_id, meter_id, fuel, direction, interval_start, interval_minutes,
        quantity_kwh, source, quality
      ) values (
        ${context.site.id}, ${meterId}, ${fuel}, ${direction}, ${row.intervalStart}, ${row.intervalMinutes},
        ${row.quantityKwh}, 'csv', 'reported'
      )
      on conflict (site_id, meter_id, direction, interval_start) do update set
        quantity_kwh = excluded.quantity_kwh,
        interval_minutes = excluded.interval_minutes,
        source = excluded.source,
        quality = excluded.quality
    `;
  }

  const connectionRows = await sql`
    select id from cobra_home_connections
    where site_id = ${context.site.id} and connection_type = 'csv'
    order by created_at asc
    limit 1
  `;
  if (connectionRows.length) {
    await sql`
      update cobra_home_connections
      set status = 'connected', last_sync_at = now(), updated_at = now()
      where id = ${connectionRows[0].id}
    `;
  } else {
    await sql`
      insert into cobra_home_connections (
        id, site_id, energy_account_id, connection_type, provider, status, last_sync_at
      ) values (
        ${`hcn_${randomUUID()}`}, ${context.site.id}, ${energyAccountId}, 'csv', 'CSV import', 'connected', now()
      )
    `;
  }
  if (energyAccountId) {
    await sql`
      update cobra_home_energy_accounts
      set connection_status = 'connected', updated_at = now()
      where id = ${energyAccountId}
    `;
  }

  return response.status(201).json({ recorded: true, siteId: context.site.id, meterId, imported: normalized.length });
}

async function addAppliance(context, body, response) {
  const allowed = applianceAllowedFields(false);
  if (Object.keys(body).some((key) => !allowed.has(key))) return response.status(400).json({ error: "unsupported_field" });

  const category = cleanOptional(body.category, 80);
  if (!category) return response.status(400).json({ error: "category_required" });
  const id = `hap_${randomUUID()}`;
  const sql = database();
  await sql`
    insert into cobra_home_appliances (
      id, site_id, category, name, manufacturer, model, gtin, rated_power_w,
      annual_energy_kwh, energy_per_cycle_kwh, flexible, connectivity, spec_source
    ) values (
      ${id}, ${context.site.id}, ${category}, ${cleanOptional(body.name, 160)},
      ${cleanOptional(body.manufacturer, 120)}, ${cleanOptional(body.model, 160)},
      ${cleanOptional(body.gtin, 40)}, ${numericOrNull(body.ratedPowerW, 0, 1000000)},
      ${numericOrNull(body.annualEnergyKwh, 0, 10000000)}, ${numericOrNull(body.energyPerCycleKwh, 0, 10000)},
      ${Boolean(body.flexible)}, ${CONNECTIVITY.has(body.connectivity) ? body.connectivity : "none"},
      ${cleanOptional(body.specSource, 240)}
    )
  `;
  return response.status(201).json({ recorded: true, siteId: context.site.id, applianceId: id });
}

async function updateAppliance(context, body, response) {
  const allowed = applianceAllowedFields(true);
  if (Object.keys(body).some((key) => !allowed.has(key))) return response.status(400).json({ error: "unsupported_field" });
  const applianceId = cleanOptional(body.applianceId, 120);
  const category = cleanOptional(body.category, 80);
  if (!applianceId || !category) return response.status(400).json({ error: "invalid_appliance" });

  const sql = database();
  const rows = await sql`
    update cobra_home_appliances
    set category = ${category},
        name = ${cleanOptional(body.name, 160)},
        manufacturer = ${cleanOptional(body.manufacturer, 120)},
        model = ${cleanOptional(body.model, 160)},
        gtin = ${cleanOptional(body.gtin, 40)},
        rated_power_w = ${numericOrNull(body.ratedPowerW, 0, 1000000)},
        annual_energy_kwh = ${numericOrNull(body.annualEnergyKwh, 0, 10000000)},
        energy_per_cycle_kwh = ${numericOrNull(body.energyPerCycleKwh, 0, 10000)},
        flexible = ${Boolean(body.flexible)},
        connectivity = ${CONNECTIVITY.has(body.connectivity) ? body.connectivity : "none"},
        spec_source = ${cleanOptional(body.specSource, 240)},
        updated_at = now()
    where id = ${applianceId} and site_id = ${context.site.id}
    returning id
  `;
  if (!rows.length) return response.status(404).json({ error: "appliance_not_found" });
  return response.status(200).json({ recorded: true, applianceId });
}

async function deleteAppliance(context, body, response) {
  const allowed = new Set(["action", "siteId", "applianceId"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) return response.status(400).json({ error: "unsupported_field" });
  const applianceId = cleanOptional(body.applianceId, 120);
  if (!applianceId) return response.status(400).json({ error: "invalid_appliance" });
  const sql = database();
  const rows = await sql`
    delete from cobra_home_appliances
    where id = ${applianceId} and site_id = ${context.site.id}
    returning id
  `;
  if (!rows.length) return response.status(404).json({ error: "appliance_not_found" });
  return response.status(200).json({ deleted: true, applianceId });
}

async function addAsset(context, body, response) {
  const allowed = new Set([
    "action", "siteId", "assetType", "name", "manufacturer", "model",
    "capacityKw", "capacityKwh", "connectivity",
  ]);
  if (Object.keys(body).some((key) => !allowed.has(key))) return response.status(400).json({ error: "unsupported_field" });

  const assetType = ASSET_TYPES.has(body.assetType) ? body.assetType : null;
  if (!assetType) return response.status(400).json({ error: "invalid_asset_type" });
  const id = `has_${randomUUID()}`;
  const sql = database();
  await sql`
    insert into cobra_home_assets (
      id, site_id, asset_type, name, manufacturer, model, capacity_kw, capacity_kwh, connectivity
    ) values (
      ${id}, ${context.site.id}, ${assetType}, ${cleanOptional(body.name, 160)},
      ${cleanOptional(body.manufacturer, 120)}, ${cleanOptional(body.model, 160)},
      ${numericOrNull(body.capacityKw, 0, 1000000)}, ${numericOrNull(body.capacityKwh, 0, 10000000)},
      ${cleanOptional(body.connectivity, 80)}
    )
  `;
  return response.status(201).json({ recorded: true, siteId: context.site.id, assetId: id });
}

async function deleteAsset(context, body, response) {
  const allowed = new Set(["action", "siteId", "assetId"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) return response.status(400).json({ error: "unsupported_field" });
  const assetId = cleanOptional(body.assetId, 120);
  if (!assetId) return response.status(400).json({ error: "invalid_asset" });
  const sql = database();
  const rows = await sql`
    delete from cobra_home_assets
    where id = ${assetId} and site_id = ${context.site.id}
    returning id
  `;
  if (!rows.length) return response.status(404).json({ error: "asset_not_found" });
  return response.status(200).json({ deleted: true, assetId });
}

async function primaryEnergyAccountId(siteId) {
  const sql = database();
  const rows = await sql`
    select id from cobra_home_energy_accounts
    where site_id = ${siteId} and is_primary = true
    limit 1
  `;
  return rows[0]?.id || null;
}

function applianceAllowedFields(includeId) {
  const fields = new Set([
    "action", "siteId", "category", "name", "manufacturer", "model", "gtin",
    "ratedPowerW", "annualEnergyKwh", "energyPerCycleKwh", "flexible", "connectivity", "specSource",
  ]);
  if (includeId) fields.add("applianceId");
  return fields;
}

async function homeContext(request, requestedSiteId) {
  const session = await getAccountSession(request);
  if (!session) return null;
  const siteId = cleanOptional(requestedSiteId || request.query?.siteId, 120);
  const site = siteId
    ? (session.sites || []).find((entry) => entry.id === siteId && entry.product === "home")
    : (session.sites || []).find((entry) => entry.product === "home");
  const product = site
    ? (session.products || []).find((entry) => entry.account_id === site.account_id && entry.product === "home")
    : null;
  return { session, site: site || null, product };
}

function cleanOptional(value, maxLength) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, maxLength) : null;
}

function numericOrNull(value, minimum, maximum) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) return null;
  return number;
}

function dateOrNull(value) {
  const text = cleanOptional(value, 40);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function dateOnlyOrNull(value) {
  const text = cleanOptional(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text || "") ? text : null;
}
