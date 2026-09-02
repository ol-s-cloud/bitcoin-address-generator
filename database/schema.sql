-- COBRA shared public-state schema
-- Stores public/aggregate product data only. NEVER store private keys, WIFs, seed phrases, entropy or recovery kits.

create table if not exists cobra_public_addresses (
  id bigserial primary key,
  address text not null,
  network text not null check (network in ('bitcoin-mainnet','bitcoin-testnet','bitcoin-signet')),
  address_type text not null,
  generator_version text,
  source_type text not null default 'human',
  created_at timestamptz not null default now(),
  published_at timestamptz not null default now(),
  last_chain_sync_at timestamptz,
  transaction_count bigint not null default 0,
  total_received_sats bigint not null default 0,
  total_sent_sats bigint not null default 0,
  balance_sats bigint not null default 0,
  last_activity_at timestamptz,
  unique(address, network)
);

create index if not exists cobra_public_addresses_network_idx on cobra_public_addresses(network);
create index if not exists cobra_public_addresses_last_activity_idx on cobra_public_addresses(last_activity_at desc);

create table if not exists cobra_poll_options (
  id bigserial primary key,
  slug text not null unique,
  label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists cobra_poll_votes (
  id bigserial primary key,
  option_id bigint not null references cobra_poll_options(id) on delete cascade,
  anonymous_voter_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(anonymous_voter_hash)
);

create index if not exists cobra_poll_votes_option_idx on cobra_poll_votes(option_id);

create table if not exists cobra_generation_events (
  id bigserial primary key,
  network text not null,
  event_type text not null default 'local-generation',
  created_at timestamptz not null default now()
);

-- This table is intentionally address-free. It supports anonymous aggregate generation counts.

create table if not exists cobra_contacts (
  id bigserial primary key,
  kind text not null,
  name text,
  email text,
  organisation text,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

insert into cobra_poll_options (slug,label)
values ('ethereum','Ethereum'),('solana','Solana'),('litecoin','Litecoin')
on conflict (slug) do nothing;
