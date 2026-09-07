(() => {
  const $ = (id) => document.getElementById(id);
  const text = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const number = (value, digits = 0) => Number.isFinite(Number(value))
    ? new Intl.NumberFormat("en-GB", { maximumFractionDigits: digits }).format(Number(value)) : "—";
  const gbp = (value, digits = 2) => Number.isFinite(Number(value))
    ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: digits }).format(Number(value)) : "—";
  const usd = (value) => Number.isFinite(Number(value))
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value)) : "—";

  let latestMetrics = {};

  const metricMap = (connectors = []) => Object.fromEntries(
    connectors.filter((item) => item?.metric?.code).map((item) => [item.metric.code, item.metric]),
  );

  const setIndicator = (id, indicator) => {
    const root = $(id); if (!root) return;
    const state = root.querySelector("[data-state]");
    const score = root.querySelector("[data-score]");
    if (!indicator?.available) {
      if (state) state.textContent = "UNAVAILABLE";
      if (score) score.textContent = "—";
      root.dataset.level = "unavailable";
      return;
    }
    if (state) state.textContent = String(indicator.state || "—").replaceAll("_", " ");
    if (score) score.textContent = `${number(indicator.score)}/100`;
    root.dataset.level = Number(indicator.score) >= 70 ? "strong" : Number(indicator.score) >= 45 ? "neutral" : "weak";
  };

  function renderEnergy(metrics) {
    const market = metrics.market_index_price;
    const imbalance = metrics.system_imbalance_price;
    const demand = metrics.transmission_system_demand;
    const generation = metrics.generation_mix;
    const surplus = metrics.forecast_surplus;
    const margin = metrics.indicated_margin;
    const carbon = metrics.carbon_intensity;
    const constraints = metrics.constraint_activity;
    const weather = metrics.weather_conditions;
    text("v2MarketPrice", market ? `${gbp(market.value)}/MWh` : "—");
    text("v2MarketPriceKwh", market ? `${number(Number(market.value) / 10, 2)}p/kWh wholesale equivalent` : "—");
    text("v2ImbalancePrice", imbalance ? `${gbp(imbalance.value)}/MWh` : "—");
    text("v2Demand", demand ? `${number(demand.value)} MW` : "—");
    text("v2Generation", generation ? `${number(generation.value)} MW` : "—");
    text("v2Surplus", surplus ? `${number(surplus.value)} MW` : "—");
    text("v2Margin", margin ? `${number(margin.value)} MW` : "—");
    text("v2Carbon", carbon ? `${number(carbon.value)} gCO₂/kWh` : "—");
    text("v2Constraints", constraints ? gbp(constraints.value, 0) + "/day" : "—");
    text("v2Weather", weather ? `${number(weather.temperatureC ?? weather.value, 1)}°C` : "—");
    const fuels = Array.isArray(generation?.fuels) ? generation.fuels : [];
    const top = [...fuels].sort((a,b)=>Number(b.generationMw)-Number(a.generationMw)).slice(0,5);
    const target = $("v2GenerationMix");
    if (target) target.innerHTML = top.length ? top.map((fuel)=>`<div class="v2-mix-row"><span>${String(fuel.fuelType||"OTHER").replaceAll("_"," ")}</span><strong>${number(fuel.generationMw)} MW</strong></div>`).join("") : '<div class="v2-empty">Generation mix unavailable.</div>';
  }

  function renderBitcoin(metrics) {
    const btc = metrics.bitcoin_network_state; if (!btc) return;
    text("v2BtcPrice", usd(btc.priceUsd ?? btc.value));
    text("v2BtcGbp", btc.priceGbp ? gbp(btc.priceGbp, 0) : "—");
    text("v2FxRate", btc.impliedGbpPerUsd ? `£${number(btc.impliedGbpPerUsd,4)} / $1` : "—");
    text("v2BtcHeight", number(btc.blockHeight));
    text("v2BtcFees", `${number(btc.fastestFeeSatVb)} sat/vB`);
    text("v2BtcMempool", number(btc.mempoolTransactions));
    text("v2BtcBlockTime", `${number(btc.averageBlockMinutes,1)} min`);
    text("v2BtcReward", `${number(btc.blockRewardBtc,3)} BTC`);
  }

  function simulateMining() {
    const btc = latestMetrics.bitcoin_network_state;
    if (!btc?.priceGbp || !btc?.hashRateGh || !btc?.btcMined24h) return;
    const device = $("simMiner")?.selectedOptions?.[0];
    const hashrateTh = Number(device?.dataset.hashrate || 234);
    const powerW = Number(device?.dataset.power || 3510);
    const units = Math.max(1, Number($("simUnits")?.value || 1));
    const tariffPence = Math.max(0, Number($("simTariff")?.value || 7));
    const poolFeePct = Math.max(0, Number($("simPoolFee")?.value || 2));
    const overheadPct = Math.max(0, Number($("simOverhead")?.value || 7));
    const networkShare = (hashrateTh * 1000 * units) / Number(btc.hashRateGh);
    const btcDayGross = networkShare * Number(btc.btcMined24h);
    const btcDayNet = btcDayGross * (1 - poolFeePct / 100);
    const revenueDay = btcDayNet * Number(btc.priceGbp);
    const machineKwhDay = (powerW / 1000) * 24 * units;
    const facilityKwhDay = machineKwhDay * (1 + overheadPct / 100);
    const electricityPricePerKwh = tariffPence / 100;
    const electricityCostDay = facilityKwhDay * electricityPricePerKwh;
    const grossMarginDay = revenueDay - electricityCostDay;
    const grossMarginPct = revenueDay > 0 ? grossMarginDay / revenueDay * 100 : null;
    const breakEvenPence = facilityKwhDay > 0 ? revenueDay / facilityKwhDay * 100 : null;
    text("simRevenue", gbp(revenueDay));
    text("simEnergyCost", gbp(electricityCostDay));
    text("simMargin", `${grossMarginDay >= 0 ? "+" : ""}${gbp(grossMarginDay)} / day`);
    text("simBtcDay", `${btcDayNet.toFixed(8)} BTC/day`);
    text("simPower", `${number(facilityKwhDay,1)} kWh/day`);
    text("simBreakEven", `${number(breakEvenPence,2)}p/kWh`);
    text("simMarginPct", grossMarginPct === null ? "—" : `${number(grossMarginPct,1)}%`);
    text("v2MiningState", grossMarginDay > 0 ? "INDICATIVELY PROFITABLE" : "INDICATIVELY LOSS-MAKING");
    text("v2MiningNote", `Sample/site simulation uses live BTC/GBP and network state with your entered tariff. Current break-even electricity price: ${number(breakEvenPence,2)}p/kWh.`);
  }

  async function loadIntelligence() {
    try {
      const response = await fetch("/api/v1/status", { headers:{Accept:"application/json"} });
      if (!response.ok) throw new Error("status_unavailable");
      const data = await response.json();
      const metrics = metricMap(data.connectors || []);
      latestMetrics = metrics;
      const indicators = data.indicators?.indicators || {};
      text("v2DataStatus", `${String(data.status||"unknown").toUpperCase()} · ${number(data.summary?.operational)}/${number(data.summary?.connected)} LIVE SOURCES`);
      text("v2CheckedAt", data.checkedAt ? `Updated ${new Date(data.checkedAt).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}` : "");
      setIndicator("indicatorEnergy", indicators.energyCondition);
      setIndicator("indicatorGrid", indicators.gridFlexibility);
      setIndicator("indicatorBitcoin", indicators.bitcoinNetwork);
      setIndicator("indicatorMining", indicators.miningEconomics);
      setIndicator("indicatorCarbon", indicators.lowCarbonCompute);
      setIndicator("indicatorWindow", indicators.computeWindow);
      renderEnergy(metrics); renderBitcoin(metrics); simulateMining();
    } catch {
      text("v2DataStatus", "DATA PLATFORM RECONNECTING");
      text("v2CheckedAt", "Live intelligence temporarily unavailable");
    }
  }

  function renderAskResult(data) {
    const target=$("askCobraResult"); if(!target)return;
    const answer=data?.answer||data?.response||data?.message||"COBRA could not derive an answer from the current public intelligence set.";
    const confidence=data?.confidence?`<span>${String(data.confidence).toUpperCase()}</span>`:"";
    target.innerHTML=`<div class="ask-result-head"><strong>COBRA</strong>${confidence}</div><p>${String(answer).replace(/[&<>]/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;"})[c])}</p>`;
  }

  async function askCobra(question) {
    const target=$("askCobraResult"); if(target)target.innerHTML='<div class="v2-empty">COBRA is reading the current network and energy state…</div>';
    try { const response=await fetch(`/api/v1/ask?q=${encodeURIComponent(question)}`,{headers:{Accept:"application/json"}}); renderAskResult(await response.json()); }
    catch { if(target)target.innerHTML='<div class="v2-empty">Ask COBRA is temporarily unavailable.</div>'; }
  }

  $("askCobraForm")?.addEventListener("submit",(event)=>{event.preventDefault();const q=String($("askCobraInput")?.value||"").trim();if(q)askCobra(q);});
  document.querySelectorAll("[data-ask]").forEach((button)=>button.addEventListener("click",()=>{const q=button.getAttribute("data-ask")||"";if($("askCobraInput"))$("askCobraInput").value=q;askCobra(q);}));
  ["simMiner","simUnits","simTariff","simPoolFee","simOverhead"].forEach((id)=>$(id)?.addEventListener("input",simulateMining));
  loadIntelligence(); window.setInterval(loadIntelligence,60000);
})();
