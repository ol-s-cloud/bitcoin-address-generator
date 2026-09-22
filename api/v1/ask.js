import { collectLiveSnapshot, metricMap } from "../../lib/data/snapshot.js";
import { derivePublicIndicatorsFromMetrics } from "../../lib/indicators/public.js";
import { answerAskCobra, ASK_COBRA_SAMPLE_QUESTIONS } from "../../lib/ask-cobra/engine.js";

export default async function handler(request, response) {
  const question = String(request?.query?.q || request?.query?.question || "").trim();

  if (!question) {
    response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return response.status(200).json({
      product: "Ask COBRA",
      version: "v1",
      mode: "deterministic",
      region: "GB",
      samples: ASK_COBRA_SAMPLE_QUESTIONS,
    });
  }

  const snapshot = await collectLiveSnapshot();
  const metrics = metricMap(snapshot.connectors);
  const indicators = derivePublicIndicatorsFromMetrics(metrics, { region: "GB" });
  const result = answerAskCobra(question, { indicators });

  response.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
  return response.status(snapshot.status === "unavailable" ? 503 : 200).json({
    product: "Ask COBRA",
    version: "v1",
    mode: "deterministic",
    region: "GB",
    checkedAt: snapshot.checkedAt,
    dataStatus: snapshot.status,
    ...result,
  });
}
