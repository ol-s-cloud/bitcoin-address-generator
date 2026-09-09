import { calculateMiningEconomics } from "../mining/economics.js";

export function buildMiningSensitivity({ site, asset, bitcoin }) {
  const base = {
    hashrateTh: asset.output * site.fleet.units,
    powerW: asset.ratedPowerW * site.fleet.units,
    networkHashrateGh: bitcoin.hashRateGh,
    btcMined24h: bitcoin.btcMined24h,
    btcPrice: bitcoin.priceGbp,
    electricityPricePerMwh: site.tariff.gbpPerMwh,
    quoteCurrency: "GBP",
    poolFeePct: site.fleet.poolFeePct,
    uptimePct: site.fleet.uptimePct,
    facilityOverheadPct: site.fleet.facilityEnergyOverheadPct,
  };

  const tariffsPenceKwh = [3, 5, 7, 10, 15];
  const tariff = tariffsPenceKwh.map((pencePerKwh) => {
    const result = calculateMiningEconomics({ ...base, electricityPricePerMwh: pencePerKwh * 10 }).output;
    return scenario(`tariff_${pencePerKwh}p`, { pencePerKwh }, result);
  });

  const btcMoves = [-20, -10, 0, 10, 20];
  const btcPrice = btcMoves.map((pct) => {
    const multiplier = 1 + pct / 100;
    const result = calculateMiningEconomics({ ...base, btcPrice: bitcoin.priceGbp * multiplier }).output;
    return scenario(`btc_${pct >= 0 ? "+" : ""}${pct}pct`, { pct, priceGbp: bitcoin.priceGbp * multiplier }, result);
  });

  const difficultyMoves = [-10, 0, 10, 20];
  const difficulty = difficultyMoves.map((pct) => {
    // For a fixed block issuance rate, expected miner share moves inversely with network difficulty/hashrate.
    const multiplier = 1 + pct / 100;
    const adjustedNetworkHashrateGh = bitcoin.hashRateGh * multiplier;
    const result = calculateMiningEconomics({ ...base, networkHashrateGh: adjustedNetworkHashrateGh }).output;
    return scenario(`difficulty_${pct >= 0 ? "+" : ""}${pct}pct`, {
      pct,
      proxyNetworkHashrateGh: adjustedNetworkHashrateGh,
      method: "difficulty_sensitivity_via_proportional_network_hashrate_proxy",
    }, result);
  });

  return { tariff, btcPrice, difficulty };
}

function scenario(id, input, output) {
  return {
    id,
    input,
    revenueGbpDay: output.revenueDay,
    electricityCostGbpDay: output.electricityCostDay,
    netContributionGbpDay: output.grossMarginDay,
    grossMarginPct: output.grossMarginPct,
    breakEvenPenceKwh: output.breakEvenElectricityPerMwh / 10,
    profitable: output.profitable,
  };
}
