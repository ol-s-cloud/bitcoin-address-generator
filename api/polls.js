import { createHash } from "node:crypto";
import {
  DatabaseConfigurationError,
  database,
  ensureSchema,
  pollState,
} from "../server/database.js";
import {
  noStore,
  parseJsonBody,
  rejectLargeBody,
  requestIsSameOrigin,
} from "../server/http.js";

const POLL_SLUGS = new Set(["next-network", "next-feature"]);
const VOTER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(request, response) {
  noStore(response);
  if (!requestIsSameOrigin(request)) {
    return response.status(403).json({ error: "origin_not_allowed" });
  }

  try {
    await ensureSchema();
    if (request.method === "GET") {
      return response.status(200).json(await pollState());
    }
    if (request.method === "POST") return submitVote(request, response);
    response.setHeader("Allow", "GET, POST");
    return response.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    console.error("COBRA poll request failed", {
      name: error?.name,
      code: error?.code,
    });
    const status = error instanceof DatabaseConfigurationError ? 503 : 500;
    return response.status(status).json({ error: "polls_unavailable" });
  }
}

async function submitVote(request, response) {
  if (rejectLargeBody(request)) {
    return response.status(413).json({ error: "payload_too_large" });
  }

  let body;
  try {
    body = parseJsonBody(request);
  } catch {
    return response.status(400).json({ error: "invalid_json" });
  }

  const poll = String(body?.poll || "");
  const option = String(body?.option || "");
  const voterId = String(body?.voterId || "");
  if (!POLL_SLUGS.has(poll) || !/^[a-z0-9-]{2,40}$/.test(option)) {
    return response.status(400).json({ error: "invalid_vote" });
  }
  if (!VOTER_ID_PATTERN.test(voterId)) {
    return response.status(400).json({ error: "invalid_voter" });
  }

  const voterHash = createHash("sha256")
    .update(`cobra-global-vote-v1:${voterId}`)
    .digest("hex");
  const sql = database();
  const saved = await sql`
    insert into cobra_poll_votes (poll_id, option_id, anonymous_voter_hash)
    select p.id, o.id, ${voterHash}
    from cobra_polls p
    join cobra_poll_options o on o.poll_id = p.id
    where
      p.slug = ${poll}
      and p.is_active = true
      and o.slug = ${option}
      and o.is_active = true
    on conflict (poll_id, anonymous_voter_hash) do update set
      option_id = excluded.option_id,
      updated_at = now()
    returning id
  `;
  if (!saved.length) {
    return response.status(400).json({ error: "invalid_vote" });
  }

  return response.status(200).json({
    selected: { poll, option },
    ...(await pollState()),
  });
}
