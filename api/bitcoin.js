const BLOCKCHAIN_API = "https://api.blockchain.info";
const REQUEST_TIMEOUT_MS = 8_000;

export default async function handler(_request, response) {
  try {
    const [statsResponse, priceResponse, transactionsResponse] =
      await Promise.all([
        fetch(`${BLOCKCHAIN_API}/stats?cors=true`, {
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        }),
        fetch(
          `${BLOCKCHAIN_API}/charts/market-price?timespan=30days&format=json&cors=true`,
          { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
        ),
        fetch(
          `${BLOCKCHAIN_API}/charts/n-transactions?timespan=30days&format=json&cors=true`,
          { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
        ),
      ]);

    if (![statsResponse, priceResponse, transactionsResponse].every((item) => item.ok)) {
      throw new Error("Blockchain.com returned an incomplete response");
    }

    const [stats, priceChart, transactionChart] = await Promise.all([
      statsResponse.json(),
      priceResponse.json(),
      transactionsResponse.json(),
    ]);

    const supplyBtc = Number(stats.totalbc) / 100_000_000;
    const priceUsd = Number(stats.market_price_usd);
    const sourceTimestamp = Number(stats.timestamp);
    const normalizedTimestamp =
      sourceTimestamp > 0 && sourceTimestamp < 1_000_000_000_000
        ? sourceTimestamp * 1000
        : sourceTimestamp;
    const updatedAt = Number.isFinite(normalizedTimestamp)
      ? new Date(normalizedTimestamp).toISOString()
      : new Date().toISOString();

    response.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=900",
    );
    response.status(200).json({
      source: "Blockchain.com",
      updatedAt,
      market: {
        priceUsd,
        marketCapUsd: priceUsd * supplyBtc,
        circulatingSupplyBtc: supplyBtc,
      },
      network: {
        blockHeight: Number(stats.n_blocks_total),
        transactions24h: Number(stats.n_tx),
        hashRateGh: Number(stats.hash_rate),
        averageBlockMinutes: Number(stats.minutes_between_blocks),
      },
      charts: {
        marketPrice: Array.isArray(priceChart.values)
          ? priceChart.values.slice(-30)
          : [],
        transactions: Array.isArray(transactionChart.values)
          ? transactionChart.values.slice(-30)
          : [],
      },
    });
  } catch {
    response.status(502).json({ error: "bitcoin_data_unavailable" });
  }
}
