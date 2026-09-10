import {
  DatabaseConfigurationError,
  database,
  ensureSchema,
  registryState,
} from "../server/database.js";
import { isMainnetP2pkhAddress } from "../server/bitcoin-address.js";
import {
  noStore,
  parseJsonBody,
  rejectLargeBody,
  requestIsSameOrigin,
} from "../server/http.js";

const ALLOWED_KEYS = new Set([
  "address",
  "visibility",
  "creationType",
  "addressType",
  "sourceType",
  "cobraVersion",
]);
const PLUS_ALLOWED_KEYS = new Set([
  "action",
  "email",
  "organization",
  "country",
  "useCase",
  "siteType",
  "powerRange",
  "interests",
  "notes",
  "sourcePath",
  "contactName",
  "postcode",
  "energySupplier",
  "smartMeterStatus",
  "connectionPreference",
]);
const UK_ALLOWED_KEYS = new Set([
  "action",
  "contactName",
  "email",
  "organization",
  "segment",
  "postcode",
  "energySupplier",
  "smartMeterStatus",
  "connectionPreference",
  "siteType",
  "powerRange",
  "assets",
  "interests",
  "notes",
  "sourcePath",
]);
const CREATION_TYPES = new Set(["created", "derived", "random-derived"]);
const PLUS_USE_CASES = new Set([
  "bitcoin_mining",
  "industrial_site",
  "data_center_compute",
  "home_energy",
  "generation_project",
  "developer_platform",
  "other",
]);
const UK_SEGMENTS = new Set([
  "home",
  "small_business",
  "commercial_industrial",
  "mining_compute",
  "generation_project",
  "developer_integration",
  "other",
]);

export default async function handler(request, response) {
  noStore(response);
  if (!requestIsSameOrigin(request)) {
    return response.status(403).json({ error: "origin_not_allowed" });
  }

  try {
    await ensureSchema();
    if (request.method === "GET") return getRegistry(request, response);
    if (request.method === "POST") return handlePost(request, response);
    response.setHeader("Allow", "GET, POST");
    return response.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    console.error("COBRA registry request failed", {
      name: error?.name,
      code: error?.code,
    });
    const status = error instanceof DatabaseConfigurationError ? 503 : 500;
    return response.status(status).json({ error: "registry_unavailable" });
  }
}

async function getRegistry(request, response) {
  const limit = Number(request.query?.limit || 10);
  const state = await registryState(limit);
  return response.status(200).json({
    network: "bitcoin-mainnet",
    ...state,
  });
}

async function handlePost(request, response) {
  if (rejectLargeBody(request)) {
    return response.status(413).json({ error: "payload_too_large" });
  }

  let body;
  try {
    body = parseJsonBody(request);
  } catch {
    return response.status(400).json({ error: "invalid_json" });
  }
  if (!body || Array.isArray(body) || typeof body !== "object") {
    return response.status(400).json({ error: "invalid_payload" });
  }

  if (body.action === "cobra_plus_waitlist") {
    return recordCobraPlusRequest(body, response);
  }
  if (body.action === "cobra_uk_registration") {
    return recordCobraUkRegistration(body, response);
  }
  return recordCreation(body, response);
}

async function recordCobraUkRegistration(body, response) {
  if (Object.keys(body).some((key) => !UK_ALLOWED_KEYS.has(key))) {
    return response.status(400).json({ error: "unsupported_field" });
  }

  const email = String(body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return response.status(400).json({ error: "invalid_email" });
  }

  const segment = UK_SEGMENTS.has(body.segment) ? body.segment : "other";
  const contactName = cleanOptional(body.contactName, 160);
  const organization = cleanOptional(body.organization, 160);
  const postcode = cleanOptional(body.postcode, 24);
  const energySupplier = cleanOptional(body.energySupplier, 120);
  const smartMeterStatus = cleanOptional(body.smartMeterStatus, 80);
  const connectionPreference = cleanOptional(body.connectionPreference, 120);
  const siteType = cleanOptional(body.siteType, 160);
  const powerRange = cleanOptional(body.powerRange, 80);
  const notes = cleanOptional(body.notes, 1500);
  const sourcePath = /^\/[A-Za-z0-9/_\-.]{0,180}$/.test(String(body.sourcePath || ""))
    ? String(body.sourcePath)
    : "/uk.html";
  const assets = cleanStringArray(body.assets, 30, 80);
  const interests = cleanStringArray(body.interests, 30, 80);

  const sql = database();
  const rows = await sql`
    insert into cobra_uk_site_registrations (
      contact_name,
      email,
      organization,
      segment,
      postcode,
      energy_supplier,
      smart_meter_status,
      connection_preference,
      site_type,
      power_range,
      assets,
      interests,
      notes,
      source_path,
      status,
      updated_at
    ) values (
      ${contactName},
      ${email},
      ${organization},
      ${segment},
      ${postcode},
      ${energySupplier},
      ${smartMeterStatus},
      ${connectionPreference},
      ${siteType},
      ${powerRange},
      ${JSON.stringify(assets)}::jsonb,
      ${JSON.stringify(interests)}::jsonb,
      ${notes},
      ${sourcePath},
      'registered',
      now()
    )
    returning id, status, created_at
  `;

  const entry = rows[0] || {};
  return response.status(201).json({
    recorded: true,
    product: "COBRA UK",
    status: entry.status || "registered",
    registrationId: entry.id || null,
    reference: entry.id ? `CBR-UK-${String(entry.id).padStart(6, "0")}` : null,
    createdAt: entry.created_at || null,
  });
}

async function recordCobraPlusRequest(body, response) {
  if (Object.keys(body).some((key) => !PLUS_ALLOWED_KEYS.has(key))) {
    return response.status(400).json({ error: "unsupported_field" });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const organization = cleanOptional(body.organization, 160);
  const country = cleanOptional(body.country, 120);
  const useCase = PLUS_USE_CASES.has(body.useCase) ? body.useCase : "other";
  const siteType = cleanOptional(body.siteType, 160);
  const powerRange = cleanOptional(body.powerRange, 80);
  const notes = cleanOptional(body.notes, 1500);
  const contactName = cleanOptional(body.contactName, 160);
  const postcode = cleanOptional(body.postcode, 24);
  const energySupplier = cleanOptional(body.energySupplier, 120);
  const smartMeterStatus = cleanOptional(body.smartMeterStatus, 80);
  const connectionPreference = cleanOptional(body.connectionPreference, 120);
  const sourcePath = /^\/[A-Za-z0-9/_\-.]{0,180}$/.test(String(body.sourcePath || ""))
    ? String(body.sourcePath)
    : "/explorer-v2-terminal.html";
  const interests = cleanStringArray(body.interests, 20, 80);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return response.status(400).json({ error: "invalid_email" });
  }

  const sql = database();
  const rows = await sql`
    insert into cobra_plus_waitlist (
      email,
      organization,
      country,
      use_case,
      site_type,
      power_range,
      interests,
      notes,
      source_path,
      status,
      contact_name,
      postcode,
      energy_supplier,
      smart_meter_status,
      connection_preference,
      updated_at
    ) values (
      ${email},
      ${organization},
      ${country},
      ${useCase},
      ${siteType},
      ${powerRange},
      ${JSON.stringify(interests)}::jsonb,
      ${notes},
      ${sourcePath},
      'waitlist',
      ${contactName},
      ${postcode},
      ${energySupplier},
      ${smartMeterStatus},
      ${connectionPreference},
      now()
    )
    on conflict (lower(email)) do update set
      organization = excluded.organization,
      country = excluded.country,
      use_case = excluded.use_case,
      site_type = excluded.site_type,
      power_range = excluded.power_range,
      interests = excluded.interests,
      notes = excluded.notes,
      source_path = excluded.source_path,
      contact_name = excluded.contact_name,
      postcode = excluded.postcode,
      energy_supplier = excluded.energy_supplier,
      smart_meter_status = excluded.smart_meter_status,
      connection_preference = excluded.connection_preference,
      updated_at = now()
    returning id, status, created_at, updated_at
  `;

  const entry = rows[0] || {};
  return response.status(201).json({
    recorded: true,
    product: "COBRA+",
    status: entry.status || "waitlist",
    requestId: entry.id || null,
    createdAt: entry.created_at || null,
    updatedAt: entry.updated_at || null,
  });
}

async function recordCreation(body, response) {
  if (Object.keys(body).some((key) => !ALLOWED_KEYS.has(key))) {
    return response.status(400).json({ error: "unsupported_field" });
  }

  const visibility = body.visibility === "public" ? "public" : "private";
  const creationType = CREATION_TYPES.has(body.creationType)
    ? body.creationType
    : "derived";
  const addressType = body.addressType === "p2pkh" ? "p2pkh" : "p2pkh";
  const sourceType = ["browser", "cli", "api"].includes(body.sourceType)
    ? body.sourceType
    : "browser";
  const cobraVersion = /^v?[0-9][0-9A-Za-z.-]{0,31}$/.test(
    String(body.cobraVersion || ""),
  )
    ? String(body.cobraVersion)
    : "v1.0.0.1";
  const address = String(body.address || "").trim();
  const isPublic = visibility === "public";

  if (isPublic && !isMainnetP2pkhAddress(address)) {
    return response.status(400).json({ error: "invalid_mainnet_address" });
  }
  if (!isPublic && address) {
    return response
      .status(400)
      .json({ error: "private_event_must_not_include_address" });
  }

  const sql = database();
  await sql`
    with creation as (
      insert into cobra_creation_events (
        network,
        creation_type,
        address_type,
        is_public,
        cobra_version
      ) values (
        'bitcoin-mainnet',
        ${creationType},
        ${addressType},
        ${isPublic},
        ${cobraVersion}
      )
      returning created_at
    ), published as (
      insert into cobra_public_addresses (
        address,
        network,
        address_type,
        cobra_version,
        source_type
      )
      select
        ${address},
        'bitcoin-mainnet',
        ${addressType},
        ${cobraVersion},
        ${sourceType}
      where ${isPublic}
      on conflict (address) do update set
        cobra_version = excluded.cobra_version,
        source_type = excluded.source_type
      returning address
    )
    select
      (select created_at from creation) as recorded_at,
      exists(select 1 from published) as published
  `;

  const state = await registryState(10);
  return response.status(201).json({
    recorded: true,
    published: isPublic,
    network: "bitcoin-mainnet",
    ...state,
  });
}

function cleanOptional(value, maxLength) {
  const text = String(value || "").trim();
  if (!text) return null;
  return text.slice(0, maxLength);
}

function cleanStringArray(value, maxItems, maxLength) {
  return Array.isArray(value)
    ? value
        .map((item) => cleanOptional(item, maxLength))
        .filter(Boolean)
        .slice(0, maxItems)
    : [];
}
