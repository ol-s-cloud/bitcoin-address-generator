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
