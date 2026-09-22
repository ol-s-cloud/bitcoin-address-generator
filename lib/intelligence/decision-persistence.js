import { database, databaseConfigured } from "../../server/database.js";

let decisionSchemaReady;

export async function persistDecisionSnapshot(snapshot) {
  if (!databaseConfigured()) return { enabled: false, saved: false };
  const sql = database();
  await ensureDecisionSchema(sql);
  const rows = await sql`
    insert into cobra_intelligence_decisions (
      checked_at, country, site_id, site_name, locality,
      asset_id, asset_manufacturer, asset_model, units,
      tariff_pence_kwh, action, condition, confidence_score,
      break_even_pence_kwh, headroom_pence_kwh, headroom_pct,
      revenue_gbp_day, electricity_cost_gbp_day, net_contribution_gbp_day,
      market_payload, bitcoin_payload, economics_payload, decision_payload
    ) values (
      ${snapshot.checkedAt}, ${snapshot.country}, ${snapshot.site.id}, ${snapshot.site.name}, ${snapshot.site.locality || ""},
      ${snapshot.asset.id}, ${snapshot.asset.manufacturer}, ${snapshot.asset.model}, ${snapshot.site.fleet.units},
      ${snapshot.site.tariff.pencePerKwh}, ${snapshot.decision.action}, ${snapshot.decision.condition}, ${snapshot.decision.dataConfidence.score},
      ${snapshot.economics.breakEvenPenceKwh}, ${snapshot.decision.economics.headroomPenceKwh}, ${snapshot.decision.economics.headroomPct},
      ${snapshot.economics.revenueGbpDay}, ${snapshot.economics.electricityCostGbpDay}, ${snapshot.economics.netContributionGbpDay},
      ${JSON.stringify(snapshot.market)}::jsonb, ${JSON.stringify(snapshot.bitcoin)}::jsonb, ${JSON.stringify(snapshot.economics)}::jsonb, ${JSON.stringify(snapshot.decision)}::jsonb
    ) returning id
  `;
  return { enabled: true, saved: true, id: rows?.[0]?.id ?? null };
}

async function ensureDecisionSchema(sql) {
  if (decisionSchemaReady) return decisionSchemaReady;
  decisionSchemaReady = (async () => {
    await sql`
      create table if not exists cobra_intelligence_decisions (
        id bigserial primary key,
        checked_at timestamptz not null,
        country text not null,
        site_id text not null,
        site_name text not null,
        locality text not null default '',
        asset_id text not null,
        asset_manufacturer text not null,
        asset_model text not null,
        units integer not null,
        tariff_pence_kwh double precision not null,
        action text not null,
        condition text not null,
        confidence_score integer not null,
        break_even_pence_kwh double precision,
        headroom_pence_kwh double precision,
        headroom_pct double precision,
        revenue_gbp_day double precision,
        electricity_cost_gbp_day double precision,
        net_contribution_gbp_day double precision,
        market_payload jsonb not null default '{}'::jsonb,
        bitcoin_payload jsonb not null default '{}'::jsonb,
        economics_payload jsonb not null default '{}'::jsonb,
        decision_payload jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now()
      )
    `;
    await sql`create index if not exists cobra_intelligence_decisions_site_time_idx on cobra_intelligence_decisions (site_id, checked_at desc)`;
    await sql`create index if not exists cobra_intelligence_decisions_asset_time_idx on cobra_intelligence_decisions (asset_id, checked_at desc)`;
    await sql`create index if not exists cobra_intelligence_decisions_condition_time_idx on cobra_intelligence_decisions (condition, checked_at desc)`;
  })().catch((error) => {
    decisionSchemaReady = undefined;
    throw error;
  });
  return decisionSchemaReady;
}
