-- COBRA shared public-state schema · v1
-- Store only public addresses and anonymous aggregate events/votes.
-- NEVER store private keys, WIFs, seed phrases, entropy, randomness or recovery kits.

create table if not exists cobra_schema_meta (
  singleton boolean primary key default true check (singleton),
  version integer not null,
  updated_at timestamptz not null default now()
);

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
);

create index if not exists cobra_public_addresses_published_idx
  on cobra_public_addresses (published_at desc);

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
);

create index if not exists cobra_creation_events_created_idx
  on cobra_creation_events (created_at desc);

create table if not exists cobra_polls (
  id bigserial primary key,
  slug text not null unique,
  question text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

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
);

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
);

create index if not exists cobra_poll_votes_option_idx
  on cobra_poll_votes (poll_id, option_id);

insert into cobra_polls (slug, question)
values
  ('next-network', 'What blockchain would you like next?'),
  ('next-feature', 'What should COBRA roll out next?')
on conflict (slug) do update set
  question = excluded.question,
  is_active = true;

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
  is_active = true;

insert into cobra_schema_meta (singleton, version, updated_at)
values (true, 1, now())
on conflict (singleton) do update set
  version = excluded.version,
  updated_at = excluded.updated_at;
