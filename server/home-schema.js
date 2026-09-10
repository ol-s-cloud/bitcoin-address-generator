import { database } from "./database.js";

let homeSchemaReady;

export async function ensureHomeSchema() {
  if (homeSchemaReady) return homeSchemaReady;
  homeSchemaReady = prepareHomeSchema().catch((error) => {
    homeSchemaReady = undefined;
    throw error;
  });
  return homeSchemaReady;
}

async function prepareHomeSchema() {
  const sql = database();
  await sql.transaction((transaction) => [
    transaction`select pg_advisory_xact_lock(2026091012)`,
    transaction`
      create table if not exists cobra_home_energy_accounts (
        id text primary key,
        site_id text not null references cobra_sites(id) on delete cascade,
        supplier text,
        account_label text,
        source_type text not null default 'manual'
          check (source_type in ('manual', 'octopus', 'smart_meter', 'csv', 'device_gateway')),
        connection_status text not null default 'not_connected'
          check (connection_status in ('not_connected', 'pending', 'connected', 'needs_attention', 'disconnected')),
        external_account_ref_masked text,
        credential_ref text,
        is_primary boolean not null default true,
        metadata jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `,
    transaction`
      create unique index if not exists cobra_home_energy_accounts_primary_idx
        on cobra_home_energy_accounts (site_id)
        where is_primary = true
    `,
    transaction`
      create table if not exists cobra_home_connections (
        id text primary key,
        site_id text not null references cobra_sites(id) on delete cascade,
        energy_account_id text references cobra_home_energy_accounts(id) on delete cascade,
        connection_type text not null
          check (connection_type in ('octopus', 'smart_meter', 'csv', 'manual', 'device_gateway', 'manufacturer_api')),
        provider text,
        status text not null default 'pending'
          check (status in ('pending', 'connected', 'needs_attention', 'disconnected')),
        external_reference_masked text,
        credential_ref text,
        permissions jsonb not null default '[]'::jsonb,
        metadata jsonb not null default '{}'::jsonb,
        last_sync_at timestamptz,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `,
    transaction`
      create index if not exists cobra_home_connections_site_idx
        on cobra_home_connections (site_id, status, created_at desc)
    `,
    transaction`
      create table if not exists cobra_home_meters (
        id text primary key,
        site_id text not null references cobra_sites(id) on delete cascade,
        energy_account_id text references cobra_home_energy_accounts(id) on delete set null,
        fuel text not null check (fuel in ('electricity', 'gas')),
        direction text not null default 'import' check (direction in ('import', 'export', 'generation')),
        identifier_masked text,
        serial_masked text,
        interval_minutes integer,
        status text not null default 'active' check (status in ('active', 'inactive')),
        metadata jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `,
    transaction`
      create index if not exists cobra_home_meters_site_idx
        on cobra_home_meters (site_id, fuel, direction)
    `,
    transaction`
      create table if not exists cobra_home_tariffs (
        id text primary key,
        site_id text not null references cobra_sites(id) on delete cascade,
        energy_account_id text references cobra_home_energy_accounts(id) on delete set null,
        fuel text not null check (fuel in ('electricity', 'gas')),
        supplier text,
        tariff_name text,
        product_code text,
        rate_type text not null default 'unknown'
          check (rate_type in ('flat', 'tou', 'dynamic', 'unknown')),
        currency text not null default 'GBP',
        unit_rate_p_per_kwh numeric,
        standing_charge_p_per_day numeric,
        valid_from timestamptz,
        valid_to timestamptz,
        source text,
        metadata jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `,
    transaction`
      create index if not exists cobra_home_tariffs_site_time_idx
        on cobra_home_tariffs (site_id, fuel, valid_from desc nulls last)
    `,
    transaction`
      create table if not exists cobra_home_tariff_rates (
        id text primary key,
        tariff_id text not null references cobra_home_tariffs(id) on delete cascade,
        site_id text not null references cobra_sites(id) on delete cascade,
        direction text not null default 'import' check (direction in ('import', 'export')),
        rate_label text,
        value_p_per_kwh numeric not null,
        valid_from timestamptz,
        valid_to timestamptz,
        source text,
        metadata jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now()
      )
    `,
    transaction`
      create index if not exists cobra_home_tariff_rates_site_time_idx
        on cobra_home_tariff_rates (site_id, valid_from desc nulls last)
    `,
    transaction`
      create table if not exists cobra_home_interval_readings (
        id bigserial primary key,
        site_id text not null references cobra_sites(id) on delete cascade,
        meter_id text references cobra_home_meters(id) on delete cascade,
        fuel text not null check (fuel in ('electricity', 'gas')),
        direction text not null default 'import' check (direction in ('import', 'export', 'generation')),
        interval_start timestamptz not null,
        interval_minutes integer not null default 30,
        quantity_kwh numeric not null,
        source text not null,
        quality text not null default 'reported'
          check (quality in ('reported', 'measured', 'estimated', 'derived')),
        metadata jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        unique (site_id, meter_id, direction, interval_start)
      )
    `,
    transaction`
      create index if not exists cobra_home_interval_readings_site_time_idx
        on cobra_home_interval_readings (site_id, interval_start desc)
    `,
    transaction`
      create table if not exists cobra_home_bills (
        id text primary key,
        site_id text not null references cobra_sites(id) on delete cascade,
        energy_account_id text references cobra_home_energy_accounts(id) on delete set null,
        supplier text,
        bill_reference_masked text,
        period_start date,
        period_end date,
        currency text not null default 'GBP',
        total_amount numeric,
        energy_charge numeric,
        standing_charge numeric,
        tax_amount numeric,
        electricity_kwh numeric,
        gas_kwh numeric,
        source text not null default 'manual',
        metadata jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `,
    transaction`
      create index if not exists cobra_home_bills_site_period_idx
        on cobra_home_bills (site_id, period_end desc nulls last)
    `,
    transaction`
      create table if not exists cobra_home_appliances (
        id text primary key,
        site_id text not null references cobra_sites(id) on delete cascade,
        category text not null,
        name text,
        manufacturer text,
        model text,
        gtin text,
        rated_power_w numeric,
        annual_energy_kwh numeric,
        energy_per_cycle_kwh numeric,
        flexible boolean not null default false,
        connectivity text not null default 'none'
          check (connectivity in ('none', 'manual', 'matter', 'mqtt', 'home_assistant', 'manufacturer_api', 'cobra')),
        spec_source text,
        spec_verified boolean not null default false,
        metadata jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `,
    transaction`alter table cobra_home_appliances add column if not exists gtin text`,
    transaction`alter table cobra_home_appliances add column if not exists annual_energy_kwh numeric`,
    transaction`
      create index if not exists cobra_home_appliances_site_idx
        on cobra_home_appliances (site_id, created_at desc)
    `,
    transaction`
      create index if not exists cobra_home_appliances_model_idx
        on cobra_home_appliances (manufacturer, model)
    `,
    transaction`
      create table if not exists cobra_home_assets (
        id text primary key,
        site_id text not null references cobra_sites(id) on delete cascade,
        asset_type text not null
          check (asset_type in ('solar', 'battery', 'ev', 'ev_charger', 'heat_pump', 'wind', 'generator', 'other')),
        name text,
        manufacturer text,
        model text,
        capacity_kw numeric,
        capacity_kwh numeric,
        connectivity text,
        metadata jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `,
    transaction`
      create index if not exists cobra_home_assets_site_idx
        on cobra_home_assets (site_id, asset_type, created_at desc)
    `,
    transaction`
      create table if not exists cobra_home_opportunities (
        id text primary key,
        site_id text not null references cobra_sites(id) on delete cascade,
        opportunity_type text not null,
        title text not null,
        description text,
        annual_value_gbp numeric,
        confidence numeric,
        status text not null default 'open'
          check (status in ('open', 'accepted', 'dismissed', 'expired')),
        assumptions jsonb not null default '{}'::jsonb,
        evidence jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `,
    transaction`
      create index if not exists cobra_home_opportunities_site_idx
        on cobra_home_opportunities (site_id, status, created_at desc)
    `,
  ]);
}
