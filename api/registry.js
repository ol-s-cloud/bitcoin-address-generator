import {
  DatabaseConfigurationError,
  database,
  ensureSchema,
  registryState,
  registerCobraPlusWaitlist,
  registerUkSite,
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
const CREATION_TYPES = new Set(["created", "derived", "random-derived"]);

export default async function handler(request, response) {
  noStore(response);
  if (!requestIsSameOrigin(request)) {
    return response.status(403).json({ error: "origin_not_allowed" });
  }

  try {
    await ensureSchema();
    if (request.method === "GET") return getRegistry(request, response);
    if (request.method === "POST") return recordCreation(request, response);
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

async function recordCreation(request, response) {
  if (rejectLargeBody(request, 16384)) {
    return response.status(413).json({ error: "payload_too_large" });
  }

  let body;
  try {
    body = parseJsonBody(request);
  } catch {
    return response.status(400).json({ error: "invalid_json" });
  }

  if (body?.action === "cobra_plus_waitlist" || body?.action === "cobra_uk_registration") {
    return recordRegistrationBody(body, response);
  }

  if (rejectLargeBody(request)) {
    return response.status(413).json({ error: "payload_too_large" });
  }
  if (!body || Array.isArray(body) || typeof body !== "object") {
    return response.status(400).json({ error: "invalid_payload" });
  }
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


async function recordRegistrationBody(body, response) {
  const email = String(body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return response.status(400).json({ error: "invalid_email" });
  }
  const clean = (value, max = 160) => {
    const text = String(value || "").trim();
    return text ? text.slice(0, max) : null;
  };
  const list = (value) => Array.isArray(value) ? value.map(v => clean(v, 80)).filter(Boolean).slice(0, 32) : [];
  if (body.action === "cobra_plus_waitlist") {
    const useCase = clean(body.useCase, 80);
    if (!useCase) return response.status(400).json({ error: "use_case_required" });
    const result = await registerCobraPlusWaitlist({
      email, organization: clean(body.organization), country: clean(body.country, 80),
      useCase, siteType: clean(body.siteType, 80), powerRange: clean(body.powerRange, 80),
      interests: list(body.interests), notes: clean(body.notes, 1500),
      sourcePath: clean(body.sourcePath, 240) || "/plus",
      contactName: clean(body.contactName), postcode: clean(body.postcode, 24),
      energySupplier: clean(body.energySupplier, 120), smartMeterStatus: clean(body.smartMeterStatus, 80),
      connectionPreference: clean(body.connectionPreference, 80)
    });
    return response.status(201).json({ registered: true, ...result });
  }
  const allowedSegments = new Set(["home","small_business","commercial_industrial","mining_compute","generation_project","developer_integration","other"]);
  const segment = allowedSegments.has(body.segment) ? body.segment : "other";
  const result = await registerUkSite({
    contactName: clean(body.contactName), email, organization: clean(body.organization), segment,
    postcode: clean(body.postcode, 24), energySupplier: clean(body.energySupplier, 120),
    smartMeterStatus: clean(body.smartMeterStatus, 80), connectionPreference: clean(body.connectionPreference, 80),
    siteType: clean(body.siteType, 160), powerRange: clean(body.powerRange, 80),
    assets: list(body.assets), interests: list(body.interests), notes: clean(body.notes, 1500),
    sourcePath: clean(body.sourcePath, 240) || "/uk"
  });
  return response.status(201).json({ registered: true, ...result });
}
