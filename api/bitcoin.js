const BLOCKCHAIN_API = "https://api.blockchain.info";
const MEMPOOL_API = "https://mempool.space/api";
const REQUEST_TIMEOUT_MS = 8_000;

export default async function handler(_request, response) {
  try {
    const requests = await Promise.allSettled([
      fetchJson(`${BLOCKCHAIN_API}/stats?cors=true`),
      fetchJson(
        `${BLOCKCHAIN_API}/charts/market-price?timespan=30days&format=json&cors=true`,
      ),
      fetchJson(
        `${BLOCKCHAIN_API}/charts/market-price?timespan=1day&rollingAverage=1hours&sampled=false&format=json&cors=true`,
      ),
      fetchJson(
        `${BLOCKCHAIN_API}/charts/n-transactions?timespan=30days&format=json&cors=true`,
      ),
      fetchJson(
        `${BLOCKCHAIN_API}/charts/hash-rate?timespan=30days&format=json&cors=true`,
      ),
      fetchJson(
        `${BLOCKCHAIN_API}/charts/estimated-transaction-volume-usd?timespan=30days&format=json&cors=true`,
      ),
      fetchJson(`${MEMPOOL_API}/blocks`),
      fetchJson(`${MEMPOOL_API}/mempool/recent`),
      fetchJson(`${MEMPOOL_API}/mempool`),
      fetchJson(`${MEMPOOL_API}/v1/fees/recommended`),
    ]);

    const [
      statsResult,
      priceChartResult,
      intradayPriceResult,
      transactionChartResult,
      hashRateChartResult,
      volumeChartResult,
      blocksResult,
      recentTransactionsResult,
      mempoolResult,
      feesResult,
    ] = requests;
    if (statsResult.status !== "fulfilled") throw statsResult.reason;

    const stats = statsResult.value;
    const priceChart = settledValue(priceChartResult, { values: [] });
    const intradayPrice = settledValue(intradayPriceResult, { values: [] });
    const transactionChart = settledValue(transactionChartResult, {
      values: [],
    });
    const hashRateChart = settledValue(hashRateChartResult, { values: [] });
    const volumeChart = settledValue(volumeChartResult, { values: [] });
    const latestBlocks = settledValue(blocksResult, []);
    const latestTransactions = settledValue(recentTransactionsResult, []);
    const mempool = settledValue(mempoolResult, {});
    const fees = settledValue(feesResult, {});

    const supplyBtc = Number(stats.totalbc) / 100_000_000;
    const priceUsd = Number(stats.market_price_usd);
    const intradayValues = normalizeChart(intradayPrice.values);
    const intradayPrices = intradayValues.map((point) => point.y);
    const high24h = intradayPrices.length
      ? Math.max(...intradayPrices)
      : priceUsd;
    const low24h = intradayPrices.length
      ? Math.min(...intradayPrices)
      : priceUsd;
    const openingPrice = intradayPrices[0] || priceUsd;
    const closingPrice = intradayPrices.at(-1) || priceUsd;
    const change24hPercent = openingPrice
      ? ((closingPrice - openingPrice) / openingPrice) * 100
      : 0;
    const sourceTimestamp = Number(stats.timestamp);
    const normalizedTimestamp =
      sourceTimestamp > 0 && sourceTimestamp < 1_000_000_000_000
        ? sourceTimestamp * 1000
        : sourceTimestamp;
    const updatedAt = Number.isFinite(normalizedTimestamp)
      ? new Date(normalizedTimestamp).toISOString()
      : new Date().toISOString();
    const latestHeight = Math.max(
      Number(stats.n_blocks_total),
      Number(latestBlocks[0]?.height || 0),
    );

    response.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=900",
    );
    response.status(200).json({
      source: "Blockchain.com + mempool.space",
      updatedAt,
      market: {
        priceUsd,
        marketCapUsd: priceUsd * supplyBtc,
        circulatingSupplyBtc: supplyBtc,
        maxSupplyBtc: 21_000_000,
        high24hUsd: high24h,
        low24hUsd: low24h,
        change24hPercent,
        estimatedVolume24hUsd: Number(stats.estimated_transaction_volume_usd),
      },
      network: {
        blockHeight: latestHeight,
        transactions24h: Number(stats.n_tx),
        hashRateGh: Number(stats.hash_rate),
        averageBlockMinutes: Number(stats.minutes_between_blocks),
        difficulty: Number(stats.difficulty),
        algorithm: "SHA-256",
        blockRewardBtc: blockReward(latestHeight),
        btcMined24h: Number(stats.n_btc_mined) / 100_000_000,
        mempoolTransactions: Number(mempool.count || 0),
        mempoolVsize: Number(mempool.vsize || 0),
        fastestFeeSatVb: Number(fees.fastestFee || 0),
      },
      charts: {
        marketPrice: normalizeChart(priceChart.values).slice(-30),
        transactions: normalizeChart(transactionChart.values).slice(-30),
        hashRate: normalizeChart(hashRateChart.values).slice(-30),
        transactionVolumeUsd: normalizeChart(volumeChart.values).slice(-30),
      },
      latestBlocks: Array.isArray(latestBlocks)
        ? latestBlocks.slice(0, 8).map((block) => ({
            id: String(block.id || ""),
            height: Number(block.height),
            timestamp: Number(block.timestamp),
            transactionCount: Number(block.tx_count || 0),
            size: Number(block.size || 0),
            weight: Number(block.weight || 0),
            pool: String(block.extras?.pool?.name || "Unknown pool"),
          }))
        : [],
      latestTransactions: Array.isArray(latestTransactions)
        ? latestTransactions.slice(0, 10).map((transaction) => ({
            txid: String(transaction.txid || ""),
            feeSats: Number(transaction.fee || 0),
            vsize: Number(transaction.vsize || 0),
            valueSats: Number(transaction.value || 0),
          }))
        : [],
    });
  } catch (error) {
    console.error("COBRA Bitcoin data request failed", {
      name: error?.name,
      code: error?.code,
    });
    response.status(502).json({ error: "bitcoin_data_unavailable" });
  }
}

async function fetchJson(url) {
  const result = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      Accept: "application/json",
      "User-Agent": "COBRA/1.0 (+https://www.cobra-protocol.org)",
    },
  });
  if (!result.ok) throw new Error(`upstream_${result.status}`);
  return result.json();
}

function settledValue(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback;
}

function normalizeChart(values) {
  if (!Array.isArray(values)) return [];
  return values
    .map((point) => ({ x: Number(point.x), y: Number(point.y) }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

function blockReward(height) {
  const halvings = Math.max(0, Math.floor(Number(height || 0) / 210_000));
  return 50 / 2 ** Math.min(halvings, 64);
}
