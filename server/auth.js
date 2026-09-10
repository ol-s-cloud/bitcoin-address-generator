import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { database } from "./database.js";
import { ensureAccountSchema } from "./account-schema.js";

const scrypt = promisify(scryptCallback);
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const COOKIE_NAME = "cobra_session";

export async function handleAccountPost(request, response, body) {
  await ensureAccountSchema();
  const action = String(body?.action || "");
  if (action === "account_register") return registerAccount(request, response, body);
  if (action === "account_login") return loginAccount(request, response, body);
  if (action === "account_logout") return logoutAccount(request, response);
  return response.status(400).json({ error: "unsupported_account_action" });
}

export async function readAccountSession(request, response) {
  await ensureAccountSchema();
  const session = await sessionFromRequest(request);
  if (!session) return response.status(401).json({ authenticated: false });
  return response.status(200).json({ authenticated: true, ...session });
}

async function registerAccount(request, response, body) {
  const allowed = new Set([
    "action",
    "email",
    "password",
    "displayName",
    "accountType",
    "accountName",
    "siteName",
    "siteType",
    "postcode",
    "product",
  ]);
  if (Object.keys(body).some((key) => !allowed.has(key))) {
    return response.status(400).json({ error: "unsupported_field" });
  }

  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const displayName = cleanOptional(body.displayName, 160);
  const accountType = body.accountType === "business" ? "business" : "personal";
  const product = ["home", "mining", "compute", "generation"].includes(body.product)
    ? body.product
    : "home";
  const siteType = cleanOptional(body.siteType, 80) || product;
  const siteName = cleanOptional(body.siteName, 160) || defaultSiteName(product);
  const accountName = cleanOptional(body.accountName, 160) || displayName || (accountType === "business" ? "COBRA Business" : "My COBRA");
  const postcode = cleanOptional(body.postcode, 24);

  if (!validEmail(email)) return response.status(400).json({ error: "invalid_email" });
  if (password.length < 12 || password.length > 128) {
    return response.status(400).json({ error: "password_length" });
  }

  const sql = database();
  const existing = await sql`select id from cobra_users where lower(email) = ${email} limit 1`;
  if (existing.length) return response.status(409).json({ error: "account_exists" });

  const userId = `usr_${randomUUID()}`;
  const accountId = `acc_${randomUUID()}`;
  const siteId = `site_${randomUUID()}`;
  const passwordHash = await hashPassword(password);

  try {
    await sql.transaction((tx) => [
      tx`
        insert into cobra_users (id, email, display_name, password_hash)
        values (${userId}, ${email}, ${displayName}, ${passwordHash})
      `,
      tx`
        insert into cobra_accounts (id, account_type, name, country_code)
        values (${accountId}, ${accountType}, ${accountName}, 'GB')
      `,
      tx`
        insert into cobra_account_members (account_id, user_id, role)
        values (${accountId}, ${userId}, 'owner')
      `,
      tx`
        insert into cobra_sites (id, account_id, product, site_type, name, country_code, postcode)
        values (${siteId}, ${accountId}, ${product}, ${siteType}, ${siteName}, 'GB', ${postcode})
      `,
      tx`
        insert into cobra_product_access (account_id, product, plan, status)
        values (${accountId}, ${product}, 'free', 'active')
        on conflict (account_id, product) do nothing
      `,
      tx`
        insert into cobra_auth_events (user_id, event_type, metadata)
        values (${userId}, 'register', ${JSON.stringify({ product })}::jsonb)
      `,
    ]);
  } catch (error) {
    if (String(error?.code || "") === "23505") {
      return response.status(409).json({ error: "account_exists" });
    }
    throw error;
  }

  const token = await createSession(userId);
  setSessionCookie(request, response, token);
  const session = await buildSession(userId);
  return response.status(201).json({ authenticated: true, ...session });
}

async function loginAccount(request, response, body) {
  const allowed = new Set(["action", "email", "password"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) {
    return response.status(400).json({ error: "unsupported_field" });
  }

  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  if (!validEmail(email) || !password) {
    return response.status(400).json({ error: "invalid_credentials" });
  }

  const sql = database();
  const rows = await sql`
    select id, password_hash, status
    from cobra_users
    where lower(email) = ${email}
    limit 1
  `;
  const user = rows[0];
  const verified = user?.password_hash ? await verifyPassword(password, user.password_hash) : false;
  if (!user || user.status !== "active" || !verified) {
    await sql`
      insert into cobra_auth_events (user_id, event_type, metadata)
      values (${user?.id || null}, 'login_failed', ${JSON.stringify({ email })}::jsonb)
    `;
    return response.status(401).json({ error: "invalid_credentials" });
  }

  const token = await createSession(user.id);
  setSessionCookie(request, response, token);
  await sql`insert into cobra_auth_events (user_id, event_type) values (${user.id}, 'login')`;
  const session = await buildSession(user.id);
  return response.status(200).json({ authenticated: true, ...session });
}

async function logoutAccount(request, response) {
  const token = readCookie(request, COOKIE_NAME);
  if (token) {
    const sql = database();
    const user = await userIdFromToken(token);
    await sql`delete from cobra_sessions where token_hash = ${hashToken(token)}`;
    if (user) {
      await sql`insert into cobra_auth_events (user_id, event_type) values (${user}, 'logout')`;
    }
  }
  clearSessionCookie(request, response);
  return response.status(200).json({ authenticated: false });
}

async function sessionFromRequest(request) {
  const token = readCookie(request, COOKIE_NAME);
  if (!token) return null;
  const sql = database();
  const tokenHash = hashToken(token);
  const rows = await sql`
    select user_id
    from cobra_sessions
    where token_hash = ${tokenHash}
      and expires_at > now()
    limit 1
  `;
  const userId = rows[0]?.user_id;
  if (!userId) return null;
  await sql`update cobra_sessions set last_seen_at = now() where token_hash = ${tokenHash}`;
  return buildSession(userId);
}

async function buildSession(userId) {
  const sql = database();
  const users = await sql`
    select id, email, display_name, status, email_verified_at, created_at
    from cobra_users
    where id = ${userId}
    limit 1
  `;
  const user = users[0];
  if (!user || user.status !== "active") return null;

  const accounts = await sql`
    select a.id, a.account_type, a.name, a.country_code, m.role
    from cobra_accounts a
    join cobra_account_members m on m.account_id = a.id
    where m.user_id = ${userId}
    order by a.created_at asc
  `;
  const sites = await sql`
    select s.id, s.account_id, s.product, s.site_type, s.name, s.country_code,
           s.postcode, s.timezone, s.currency, s.status, s.created_at
    from cobra_sites s
    join cobra_account_members m on m.account_id = s.account_id
    where m.user_id = ${userId}
    order by s.created_at asc
  `;
  const products = await sql`
    select p.account_id, p.product, p.plan, p.status, p.metadata
    from cobra_product_access p
    join cobra_account_members m on m.account_id = p.account_id
    where m.user_id = ${userId}
    order by p.product asc
  `;

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      emailVerified: Boolean(user.email_verified_at),
      createdAt: user.created_at,
    },
    accounts,
    sites,
    products,
  };
}

async function createSession(userId) {
  const sql = database();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  await sql`
    insert into cobra_sessions (token_hash, user_id, expires_at)
    values (${tokenHash}, ${userId}, now() + interval '30 days')
  `;
  return token;
}

async function userIdFromToken(token) {
  const sql = database();
  const rows = await sql`select user_id from cobra_sessions where token_hash = ${hashToken(token)} limit 1`;
  return rows[0]?.user_id || null;
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("base64url")}$${Buffer.from(derived).toString("base64url")}`;
}

async function verifyPassword(password, stored) {
  try {
    const [algorithm, nText, rText, pText, saltText, hashText] = String(stored).split("$");
    if (algorithm !== "scrypt") return false;
    const N = Number(nText);
    const r = Number(rText);
    const p = Number(pText);
    if (N !== 16384 || r !== 8 || p !== 1) return false;
    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(hashText, "base64url");
    const derived = Buffer.from(await scrypt(password, salt, expected.length, { N, r, p }));
    return expected.length === derived.length && timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}

function setSessionCookie(request, response, token) {
  response.setHeader("Set-Cookie", serializeCookie(request, token, SESSION_SECONDS));
}

function clearSessionCookie(request, response) {
  response.setHeader("Set-Cookie", serializeCookie(request, "", 0));
}

function serializeCookie(request, value, maxAge) {
  const host = String(request.headers?.["x-forwarded-host"] || request.headers?.host || "")
    .split(",")[0]
    .trim()
    .split(":")[0];
  const secure = !/^localhost$|^127\.0\.0\.1$/.test(host);
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function readCookie(request, name) {
  const header = String(request.headers?.cookie || "");
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    if (key !== name) continue;
    try {
      return decodeURIComponent(part.slice(index + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

function hashToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function cleanOptional(value, maxLength) {
  const text = String(value || "").trim();
  return text ? text.slice(0, maxLength) : null;
}

function defaultSiteName(product) {
  if (product === "mining") return "My Mining Site";
  if (product === "compute") return "My Compute Site";
  if (product === "generation") return "My Generation Site";
  return "My Home";
}
