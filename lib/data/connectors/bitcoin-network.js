import { fetchJson } from "../http.js";

const BLOCKCHAIN_API = "https://api.blockchain.info";
const BLOCKCHAIN_TICKER = "https://blockchain.info/ticker";
const MEMPOOL_API = "https://mempool.space/api";

export async function getBitcoinNetworkState(options = {}) {
  const fetcher = options.fetcher ?? fetchJson;
  const attemptedAt = new Date().toISOString();

  try {
    const [statsResult, tickerResult, feesResult, mempoolResult, blocksResult] = await Promise.all([
      fetcher(`${BLOCKCHAIN_API}/stats?cors=true`),
      fetcher(`${BLOCKCHAIN_TICKER}?cors=true`),
      fetcher(`${MEMPOOL_API}/v1/fees/recommended`),
      fetcher(`${MEMPOOL_API}/mempool`),
      fetcher(`${MEMPOOL_API}/blocks`),
    ]);

    const stats = statsResult.data || {};
    const ticker = tickerResult.data || {};
    const fees = feesResult.data || {};
    const mempool = mempoolResult.data || {};
    const blocks = Array.isArray(blocksResult.data) ? blocksResult.data : [];
    const latestHeight = Math.max(Number(stats.n_blocks_total || 0), Number(blocks[0]?.height || 0));
    const sourceTimestamp = Number(stats.timestamp || 0);
    const normalizedTimestamp = sourceTimestamp > 0 && sourceTimestamp < 1_000_000_000_000
      ? sourceTimestamp * 1000
      : sourceTimestamp;
    const observedAt = Number.isFinite(normalizedTimestamp) && normalizedTimestamp > 0
      ? new Date(normalizedTimestamp).toISOString()
      : statsResult.fetchedAt;

    const priceUsd = numberOrNull(ticker?.USD?.last ?? stats.market_price_usd);
    const priceGbp = numberOrNull(ticker?.GBP?.last);
    if (priceUsd === null) throw new Error("invalid_bitcoin_stats_payload");
    const impliedGbpPerUsd = priceGbp !== null && priceUsd > 0 ? priceGbp / priceUsd : null;

    return {
      source: {
        id: "bitcoin-network",
        provider: "Blockchain.com + mempool.space",
        dataset: "Bitcoin Network State",
        endpoint: `${BLOCKCHAIN_API}/stats + ${BLOCKCHAIN_TICKER} + ${MEMPOOL_API}`,
        licence: "provider terms",
      },
      metric: {
        region: "global",
        code: "bitcoin_network_state",
        value: priceUsd,
        unit: "USD/BTC",
        observedAt,
        priceUsd,
        priceGbp,
        impliedGbpPerUsd,
        blockHeight: latestHeight,
        difficulty: numberOrNull(stats.difficulty),
        hashRateGh: numberOrNull(stats.hash_rate),
        averageBlockMinutes: numberOrNull(stats.minutes_between_blocks),
        transactions24h: numberOrNull(stats.n_tx),
        btcMined24h: numberOrNull(stats.n_btc_mined) === null ? null : Number(stats.n_btc_mined) / 100_000_000,
        blockRewardBtc: blockReward(latestHeight),
        mempoolTransactions: numberOrNull(mempool.count),
        mempoolVsize: numberOrNull(mempool.vsize),
        fastestFeeSatVb: numberOrNull(fees.fastestFee),
        halfHourFeeSatVb: numberOrNull(fees.halfHourFee),
        hourFeeSatVb: numberOrNull(fees.hourFee),
      },
      health: {
        status: "operational",
        lastAttemptAt: attemptedAt,
        lastSuccessAt: statsResult.fetchedAt,
        latencyMs: Math.max(statsResult.latencyMs, tickerResult.latencyMs, feesResult.latencyMs, mempoolResult.latencyMs, blocksResult.latencyMs),
        latestDataTimestamp: observedAt,
        stale: Date.now() - Date.parse(observedAt) > 30 * 60 * 1000,
        lastError: null,
      },
    };
  } catch (error) {
    return {
      source: {
        id: "bitcoin-network",
        provider: "Blockchain.com + mempool.space",
        dataset: "Bitcoin Network State",
        endpoint: `${BLOCKCHAIN_API}/stats + ${BLOCKCHAIN_TICKER} + ${MEMPOOL_API}`,
        licence: "provider terms",
      },
      metric: null,
      health: {
        status: "unavailable",
        lastAttemptAt: attemptedAt,
        lastSuccessAt: null,
        latencyMs: Number(error?.latencyMs ?? 0),
        latestDataTimestamp: null,
        stale: true,
        lastError: String(error?.message || "unknown_error"),
      },
    };
  }
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function blockReward(height) {
  const halvings = Math.max(0, Math.floor(Number(height || 0) / 210_000));
  return 50 / 2 ** Math.min(halvings, 64);
}
