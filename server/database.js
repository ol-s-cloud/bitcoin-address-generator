import { neon } from "@neondatabase/serverless";

const SCHEMA_VERSION = 1;
let sqlClient;
let schemaReady;

export class DatabaseConfigurationError extends Error {
  constructor() {
    super("COBRA database connection is not configured");
    this.name = "DatabaseConfigurationError";
  }
}

function connectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.NEON_POSTGRES_URL ||
    ""
  ).trim();
}

export function databaseConfigured() {
  return /^postgres(?:ql)?:\/\//i.test(connectionString());
}

export function database() {
  if (!databaseConfigured()) throw new DatabaseConfigurationError();
  if (!sqlClient) sqlClient = neon(connectionString());
  return sqlClient;
}

export async function ensureSchema() {
  if (schemaReady) return schemaReady;
  schemaReady = prepareSchema().catch((error) => {
    schemaReady = undefined;
    throw error;
  });
  return schemaReady;
}

async function prepareSchema() {
  const sql = database();
  await sql.transaction((transaction) => [
    transaction`select pg_advisory_xact_lock(20260903)`,
    transaction`
      create table if not exists cobra_schema_meta (
        singleton boolean primary key default true check (singleton),
        version integer not null,
        updated_at timestamptz not null default now()
      )
    `,
    transaction`
      create table if not exists cobra_public_addresses (
        id bigserial primary key,
        address text not null unique,
        network text not null default 'bitcoin-mainnet'
          check (network = 'bitcoin-mainnet'),
        address_type text not null default 'p2pkh'
          check (address_type = 'p2pkh'),
        cobra_version text not null default 'v1.0.0.1',
        source_type text not null default 'browser'
          check (source_type in ('browser', 'cli', 'api')),
        created_at timestamptz not null default now(),
        published_at timestamptz not null default now()
      )
    `,
    transaction`
      create index if not exists cobra_public_addresses_published_idx
        on cobra_public_addresses (published_at desc)
    `,
    transaction`
      create table if not exists cobra_creation_events (
        id bigserial primary key,
        network text not null default 'bitcoin-mainnet'
          check (network = 'bitcoin-mainnet'),
        creation_type text not null
          check (creation_type in ('created', 'derived', 'random-derived')),
        address_type text not null default 'p2pkh'
          check (address_type = 'p2pkh'),
        is_public boolean not null default false,
        cobra_version text not null default 'v1.0.0.1',
        created_at timestamptz not null default now()
      )
    `,
    transaction`
      create index if not exists cobra_creation_events_created_idx
        on cobra_creation_events (created_at desc)
    `,
    transaction`
      create table if not exists cobra_polls (
        id bigserial primary key,
        slug text not null unique,
        question text not null,
        is_active boolean not null default true,
        created_at timestamptz not null default now()
      )
    `,
    transaction`
      create table if not exists cobra_poll_options (
        id bigserial primary key,
        poll_id bigint not null references cobra_polls(id) on delete cascade,
        slug text not null,
        label text not null,
        display_order integer not null default 0,
        is_active boolean not null default true,
        created_at timestamptz not null default now(),
        unique (poll_id, slug),
        unique (poll_id, id)
      )
    `,
    transaction`
      create table if not exists cobra_poll_votes (
        id bigserial primary key,
        poll_id bigint not null references cobra_polls(id) on delete cascade,
        option_id bigint not null,
        anonymous_voter_hash text not null check (length(anonymous_voter_hash) = 64),
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        foreign key (poll_id, option_id)
          references cobra_poll_options(poll_id, id) on delete cascade,
        unique (poll_id, anonymous_voter_hash)
      )
    `,
    transaction`
      create index if not exists cobra_poll_votes_option_idx
        on cobra_poll_votes (poll_id, option_id)
    `,
    transaction`
      insert into cobra_polls (slug, question)
      values
        ('next-network', 'What blockchain would you like next?'),
        ('next-feature', 'What should COBRA roll out next?')
      on conflict (slug) do update set
        question = excluded.question,
        is_active = true
    `,
    transaction`
      insert into cobra_poll_options (poll_id, slug, label, display_order)
      select p.id, option.slug, option.label, option.display_order
      from cobra_polls p
      join (values
        ('next-network', 'ethereum-evm', 'Ethereum (EVM Ecosystem)', 0),
        ('next-network', 'solana', 'Solana', 1),
        ('next-network', 'litecoin', 'Litecoin', 2),
        ('next-network', 'other', 'Other / Suggest', 3),
        ('next-feature', 'onchain-privacy', 'Onchain privacy', 0),
        ('next-feature', 'wallet-systems', 'Wallet systems', 1),
        ('next-feature', 'cold-storage', 'Cold-storage integrations', 2),
        ('next-feature', 'cross-border-payments', 'COBRA cross-border payments', 3),
        ('next-feature', 'offline', 'Offline functionality', 4),
        ('next-feature', 'api-sdk', 'Public API & SDK', 5),
        ('next-feature', 'mining-intelligence', 'COBRA Mining & Intelligence', 6)
      ) as option(poll_slug, slug, label, display_order)
        on option.poll_slug = p.slug
      on conflict (poll_id, slug) do update set
        label = excluded.label,
        display_order = excluded.display_order,
        is_active = true
    `,
    transaction`
      insert into cobra_schema_meta (singleton, version, updated_at)
      values (true, ${SCHEMA_VERSION}, now())
      on conflict (singleton) do update set
        version = excluded.version,
        updated_at = excluded.updated_at
    `,
  ]);
}

export async function registryState(limit = 10) {
  const sql = database();
  const safeLimit = Math.max(1, Math.min(25, Number(limit) || 10));
  const [metricRows, recentAddresses] = await sql.transaction([
    sql`
      select
        (select count(*)::integer from cobra_creation_events) as addresses_created,
        (select count(*)::integer from cobra_creation_events where is_public = false) as private_creations,
        (select count(*)::integer from cobra_public_addresses) as public_addresses,
        (select count(*)::integer from cobra_poll_votes) as global_votes,
        (select max(created_at) from cobra_creation_events) as last_created_at
    `,
    sql`
      select address, network, address_type, cobra_version, published_at
      from cobra_public_addresses
      order by published_at desc
      limit ${safeLimit}
    `,
  ]);
  const metrics = metricRows[0] || {};
  return {
    metrics: {
      addressesCreated: Number(metrics.addresses_created || 0),
      privateCreations: Number(metrics.private_creations || 0),
      publicAddresses: Number(metrics.public_addresses || 0),
      globalVotes: Number(metrics.global_votes || 0),
      lastCreatedAt: metrics.last_created_at || null,
    },
    recentAddresses,
  };
}

export async function pollState() {
  const sql = database();
  const rows = await sql`
    select
      p.slug as poll_slug,
      p.question,
      o.slug as option_slug,
      o.label,
      o.display_order,
      count(v.id)::integer as votes
    from cobra_polls p
    join cobra_poll_options o on o.poll_id = p.id and o.is_active = true
    left join cobra_poll_votes v
      on v.poll_id = p.id and v.option_id = o.id
    where p.is_active = true
    group by p.id, p.slug, p.question, o.id, o.slug, o.label, o.display_order
    order by p.id, o.display_order
  `;
  const polls = {};
  for (const row of rows) {
    if (!polls[row.poll_slug]) {
      polls[row.poll_slug] = {
        slug: row.poll_slug,
        question: row.question,
        totalVotes: 0,
        options: [],
      };
    }
    const votes = Number(row.votes || 0);
    polls[row.poll_slug].totalVotes += votes;
    polls[row.poll_slug].options.push({
      slug: row.option_slug,
      label: row.label,
      votes,
    });
  }
  return { polls };
}
