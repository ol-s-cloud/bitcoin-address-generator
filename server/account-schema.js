import { database } from "./database.js";

let accountSchemaReady;

export async function ensureAccountSchema() {
  if (accountSchemaReady) return accountSchemaReady;
  accountSchemaReady = prepareAccountSchema().catch((error) => {
    accountSchemaReady = undefined;
    throw error;
  });
  return accountSchemaReady;
}

async function prepareAccountSchema() {
  const sql = database();
  await sql.transaction((transaction) => [
    transaction`select pg_advisory_xact_lock(20260910)`,
    transaction`
      create table if not exists cobra_users (
        id text primary key,
        email text not null check (length(email) between 3 and 254),
        display_name text,
        password_hash text not null,
        status text not null default 'active'
          check (status in ('active', 'disabled')),
        email_verified_at timestamptz,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `,
    transaction`
      create unique index if not exists cobra_users_email_idx
        on cobra_users (lower(email))
    `,
    transaction`
      create table if not exists cobra_accounts (
        id text primary key,
        account_type text not null default 'personal'
          check (account_type in ('personal', 'business')),
        name text not null,
        country_code text not null default 'GB'
          check (length(country_code) = 2),
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `,
    transaction`
      create table if not exists cobra_account_members (
        account_id text not null references cobra_accounts(id) on delete cascade,
        user_id text not null references cobra_users(id) on delete cascade,
        role text not null default 'owner'
          check (role in ('owner', 'admin', 'member', 'viewer')),
        created_at timestamptz not null default now(),
        primary key (account_id, user_id)
      )
    `,
    transaction`
      create index if not exists cobra_account_members_user_idx
        on cobra_account_members (user_id, created_at desc)
    `,
    transaction`
      create table if not exists cobra_sites (
        id text primary key,
        account_id text not null references cobra_accounts(id) on delete cascade,
        product text not null default 'home'
          check (product in ('home', 'mining', 'compute', 'generation', 'general')),
        site_type text not null default 'home',
        name text not null,
        country_code text not null default 'GB'
          check (length(country_code) = 2),
        postcode text,
        timezone text not null default 'Europe/London',
        currency text not null default 'GBP',
        status text not null default 'active'
          check (status in ('active', 'archived')),
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `,
    transaction`
      create index if not exists cobra_sites_account_product_idx
        on cobra_sites (account_id, product, created_at desc)
    `,
    transaction`
      create table if not exists cobra_product_access (
        account_id text not null references cobra_accounts(id) on delete cascade,
        product text not null
          check (product in ('home', 'mining', 'compute', 'generation', 'developer', 'plus')),
        plan text not null default 'free',
        status text not null default 'active'
          check (status in ('active', 'trial', 'paused', 'cancelled')),
        metadata jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        primary key (account_id, product)
      )
    `,
    transaction`
      create table if not exists cobra_sessions (
        token_hash text primary key check (length(token_hash) = 64),
        user_id text not null references cobra_users(id) on delete cascade,
        expires_at timestamptz not null,
        created_at timestamptz not null default now(),
        last_seen_at timestamptz not null default now()
      )
    `,
    transaction`
      create index if not exists cobra_sessions_user_expiry_idx
        on cobra_sessions (user_id, expires_at desc)
    `,
    transaction`
      create table if not exists cobra_auth_events (
        id bigserial primary key,
        user_id text references cobra_users(id) on delete set null,
        event_type text not null
          check (event_type in ('register', 'login', 'logout', 'login_failed')),
        metadata jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now()
      )
    `,
    transaction`
      create index if not exists cobra_auth_events_user_time_idx
        on cobra_auth_events (user_id, created_at desc)
    `,
    transaction`delete from cobra_sessions where expires_at <= now()`,
  ]);
}
