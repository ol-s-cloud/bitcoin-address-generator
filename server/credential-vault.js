import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";
import { database } from "./database.js";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
let schemaReady;

export class CredentialVaultConfigurationError extends Error {
  constructor() {
    super("COBRA credential encryption is not configured");
    this.name = "CredentialVaultConfigurationError";
    this.code = "credential_vault_not_configured";
  }
}

export async function ensureCredentialVaultSchema() {
  if (schemaReady) return schemaReady;
  schemaReady = prepareSchema().catch((error) => {
    schemaReady = undefined;
    throw error;
  });
  return schemaReady;
}

export function credentialVaultConfigured() {
  try {
    encryptionKey();
    return true;
  } catch {
    return false;
  }
}

export async function storeCredential({ siteId, provider, kind, secret, metadata = {} }) {
  await ensureCredentialVaultSchema();
  const cleanSiteId = String(siteId || "").trim();
  const cleanProvider = String(provider || "").trim().toLowerCase();
  const cleanKind = String(kind || "").trim().toLowerCase();
  const cleanSecret = String(secret || "");
  if (!cleanSiteId || !cleanProvider || !cleanKind || !cleanSecret) {
    throw new TypeError("credential_fields_required");
  }

  const id = `cred_${randomUUID()}`;
  const aad = `${cleanSiteId}|${cleanProvider}|${cleanKind}|${id}`;
  const encrypted = encrypt(cleanSecret, aad);
  const sql = database();
  await sql`
    insert into cobra_credentials (
      id, site_id, provider, credential_kind, algorithm, iv, auth_tag,
      ciphertext, metadata, created_at, updated_at
    ) values (
      ${id}, ${cleanSiteId}, ${cleanProvider}, ${cleanKind}, ${ALGORITHM},
      ${encrypted.iv}, ${encrypted.authTag}, ${encrypted.ciphertext},
      ${JSON.stringify(metadata || {})}::jsonb, now(), now()
    )
  `;
  return id;
}

export async function replaceCredential({ credentialId, siteId, provider, kind, secret, metadata = {} }) {
  await ensureCredentialVaultSchema();
  const id = String(credentialId || "").trim();
  const cleanSiteId = String(siteId || "").trim();
  const cleanProvider = String(provider || "").trim().toLowerCase();
  const cleanKind = String(kind || "").trim().toLowerCase();
  const cleanSecret = String(secret || "");
  if (!id || !cleanSiteId || !cleanProvider || !cleanKind || !cleanSecret) {
    throw new TypeError("credential_fields_required");
  }

  const aad = `${cleanSiteId}|${cleanProvider}|${cleanKind}|${id}`;
  const encrypted = encrypt(cleanSecret, aad);
  const sql = database();
  const rows = await sql`
    update cobra_credentials
    set algorithm = ${ALGORITHM}, iv = ${encrypted.iv}, auth_tag = ${encrypted.authTag},
        ciphertext = ${encrypted.ciphertext}, metadata = ${JSON.stringify(metadata || {})}::jsonb,
        updated_at = now()
    where id = ${id} and site_id = ${cleanSiteId}
      and provider = ${cleanProvider} and credential_kind = ${cleanKind}
      and revoked_at is null
    returning id
  `;
  if (!rows.length) throw new Error("credential_not_found");
  return id;
}

export async function readCredential({ credentialId, siteId, provider, kind }) {
  await ensureCredentialVaultSchema();
  const id = String(credentialId || "").trim();
  const cleanSiteId = String(siteId || "").trim();
  const cleanProvider = String(provider || "").trim().toLowerCase();
  const cleanKind = String(kind || "").trim().toLowerCase();
  const sql = database();
  const rows = await sql`
    select id, algorithm, iv, auth_tag, ciphertext
    from cobra_credentials
    where id = ${id} and site_id = ${cleanSiteId}
      and provider = ${cleanProvider} and credential_kind = ${cleanKind}
      and revoked_at is null
    limit 1
  `;
  const row = rows[0];
  if (!row) return null;
  if (row.algorithm !== ALGORITHM) throw new Error("unsupported_credential_algorithm");
  const aad = `${cleanSiteId}|${cleanProvider}|${cleanKind}|${id}`;
  return decrypt(row, aad);
}

export async function revokeCredential({ credentialId, siteId }) {
  await ensureCredentialVaultSchema();
  const id = String(credentialId || "").trim();
  const cleanSiteId = String(siteId || "").trim();
  const sql = database();
  const rows = await sql`
    update cobra_credentials
    set revoked_at = now(), updated_at = now()
    where id = ${id} and site_id = ${cleanSiteId} and revoked_at is null
    returning id
  `;
  return rows.length > 0;
}

async function prepareSchema() {
  const sql = database();
  await sql.transaction((transaction) => [
    transaction`select pg_advisory_xact_lock(2026091013)`,
    transaction`
      create table if not exists cobra_credentials (
        id text primary key,
        site_id text not null references cobra_sites(id) on delete cascade,
        provider text not null,
        credential_kind text not null,
        algorithm text not null,
        iv text not null,
        auth_tag text not null,
        ciphertext text not null,
        metadata jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        revoked_at timestamptz
      )
    `,
    transaction`
      create index if not exists cobra_credentials_site_provider_idx
        on cobra_credentials (site_id, provider, credential_kind, created_at desc)
    `,
  ]);
}

function encrypt(plaintext, aad) {
  const key = encryptionKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64url"),
    authTag: authTag.toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
  };
}

function decrypt(row, aad) {
  const key = encryptionKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(row.iv, "base64url"));
  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(Buffer.from(row.auth_tag, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(row.ciphertext, "base64url")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

function encryptionKey() {
  const raw = String(process.env.COBRA_CREDENTIAL_ENCRYPTION_KEY || "").trim();
  if (!raw) throw new CredentialVaultConfigurationError();
  let key;
  try {
    key = Buffer.from(raw, "base64");
  } catch {
    throw new CredentialVaultConfigurationError();
  }
  if (key.length !== KEY_BYTES) throw new CredentialVaultConfigurationError();
  return key;
}
