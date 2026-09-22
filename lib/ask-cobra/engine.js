export const ASK_COBRA_SAMPLE_QUESTIONS = [
  "Is GB electricity favourable right now?",
  "Is the grid in surplus?",
  "How is the Bitcoin network looking?",
  "Is this a good compute window?",
  "How carbon intensive is electricity right now?",
  "Would an S21 Pro be profitable right now?",
];

export function answerAskCobra(question, snapshot = {}) {
  const query = String(question || "").trim();
  const normalized = query.toLowerCase();
  const indicators = snapshot.indicators?.indicators || {};
  const inputs = snapshot.indicators?.inputs || {};

  if (!query) {
    return {
      status: "needs_question",
      answer: "Ask COBRA a question about GB energy, grid conditions, Bitcoin, mining or compute conditions.",
      samples: ASK_COBRA_SAMPLE_QUESTIONS,
    };
  }

  if (containsAny(normalized, ["profitable", "profitability", "s21", "miner", "mining economics", "mine bitcoin"])) {
    const mining = indicators.miningEconomics;
    if (!mining?.available) {
      return response("mining", query,
        "COBRA can calculate miner profitability, but the live public snapshot does not yet have a same-currency site electricity cost and BTC quote. Add a miner and tariff, or provide normalized economics inputs, to produce a reliable mining margin.",
        mining,
        ["device", "site_tariff", "same_currency_btc_price"]);
    }
    return response("mining", query,
      `Mining economics are currently ${human(mining.state)} with a COBRA score of ${mining.score}/100.`,
      mining);
  }

  if (containsAny(normalized, ["electricity", "energy price", "power price", "cheap power", "expensive power"])) {
    const item = indicators.energyCondition;
    return response("energy", query,
      item?.available
        ? `GB energy conditions are currently ${human(item.state)} at approximately £${format(inputs.marketPricePerMwh)}/MWh on the current market index input.`
        : "COBRA does not currently have enough live data to classify GB energy conditions.",
      item);
  }

  if (containsAny(normalized, ["surplus", "grid", "flexibility", "demand"])) {
    const item = indicators.gridFlexibility;
    return response("grid", query,
      item?.available
        ? `GB grid flexibility is currently ${human(item.state)}. Forecast surplus is ${format(inputs.surplusMw)} MW against demand of ${format(inputs.demandMw)} MW.`
        : "COBRA does not currently have enough live data to classify GB grid flexibility.",
      item);
  }

  if (containsAny(normalized, ["carbon", "clean", "low carbon", "green electricity"])) {
    const item = indicators.lowCarbonCompute;
    return response("carbon", query,
      item?.available
        ? `Low-carbon compute conditions are currently ${human(item.state)} with carbon intensity around ${format(inputs.carbonIntensity)} gCO₂/kWh.`
        : "COBRA does not currently have enough live carbon data to classify conditions.",
      item);
  }

  if (containsAny(normalized, ["bitcoin", "mempool", "fee", "block", "network"])) {
    const item = indicators.bitcoinNetwork;
    return response("bitcoin", query,
      item?.available
        ? `Bitcoin network conditions are currently ${human(item.state)} with average block time around ${format(inputs.averageBlockMinutes)} minutes and fastest fee around ${format(inputs.fastestFeeSatVb)} sat/vB.`
        : "COBRA does not currently have enough live Bitcoin data to classify network conditions.",
      item);
  }

  if (containsAny(normalized, ["compute", "window", "operate", "run now", "good time"])) {
    const item = indicators.computeWindow;
    return response("compute", query,
      item?.available
        ? `The public COBRA Compute Window is ${human(item.state)} with a score of ${item.score}/100. This is a market-level signal, not yet a personalised device instruction.`
        : "COBRA does not currently have enough evidence to open a public compute window.",
      item);
  }

  return {
    status: "unsupported_question",
    topic: "general",
    question: query,
    answer: "Ask COBRA V1 currently covers GB energy, grid flexibility, carbon, Bitcoin network conditions, compute windows and basic mining economics.",
    samples: ASK_COBRA_SAMPLE_QUESTIONS,
  };
}

function response(topic, question, answer, indicator, requires = undefined) {
  return {
    status: indicator?.available ? "answered" : "limited",
    topic,
    question,
    answer,
    indicator: indicator || null,
    ...(requires ? { requires } : {}),
  };
}

function containsAny(value, terms) { return terms.some((term) => value.includes(term)); }
function human(value) { return String(value || "unknown").replaceAll("_", " ").toLowerCase(); }
function format(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "unavailable";
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(number);
}
