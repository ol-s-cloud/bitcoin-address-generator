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
  let latestIndicators = {};

  const metricMap = (connectors = []) => Object.fromEntries(
    connectors.filter((item) => item?.metric?.code).map((item) => [item.metric.code, item.metric]),
  );

  function ensureEnergyIntelligenceSurface() {
    if ($("cobraPowerIndex")) return;
    const anchor = document.querySelector(".v2-context-bar");
    if (!anchor) return;
    const section = document.createElement("section");
    section.className = "cobra-power-surface";
    section.innerHTML = `
      <article class="cobra-power-index-card">
        <div class="eyebrow">COBRA POWER INDEX · UNITED KINGDOM</div>
        <div class="cobra-power-index-main">
          <div><strong id="cobraPowerIndex">—</strong><span>/100</span></div>
          <div><b id="cobraPowerState">CALCULATING</b><small id="cobraPowerAction">Reading current power conditions…</small></div>
        </div>
        <div class="cobra-power-scale" aria-label="COBRA Power Index scale"><span>EXPENSIVE</span><span>NORMAL</span><span>FAVOURABLE</span></div>
        <div class="cobra-power-reasons" id="cobraPowerReasons"><span>Waiting for live electricity, grid and carbon signals.</span></div>
        <p class="cobra-index-method">Transparent public index derived from live wholesale price, grid flexibility and carbon conditions. It describes market/flexible-load conditions, not your retail tariff.</p>
      </article>
      <article class="cobra-balance-card">
        <div class="eyebrow">GRID BALANCE</div>
        <div class="cobra-balance-value"><strong id="cobraBalanceValue">—</strong><span id="cobraBalanceState">CALCULATING</span></div>
        <div class="cobra-balance-track"><span></span><i id="cobraBalanceMarker"></i></div>
        <div class="cobra-balance-labels"><span>DEFICIT / TIGHT</span><span>BALANCED</span><span>SURPLUS</span></div>
        <p id="cobraBalanceExplanation">Reading the current GB flexibility signal.</p>
      </article>
      <article class="cobra-price-chart-card">
        <div class="cobra-chart-head"><div><div class="eyebrow">WHOLESALE ELECTRICITY</div><h3>Price movement</h3></div><div><strong id="cobraPriceMovement">—</strong><small id="cobraPriceAverage">24H history</small></div></div>
        <div class="cobra-energy-chart" id="cobraEnergyChart"><div class="v2-empty">Loading COBRA price history…</div></div>
        <div class="cobra-chart-foot"><span id="cobraChartLow">LOW —</span><span id="cobraChartCurrent">NOW —</span><span id="cobraChartHigh">HIGH —</span></div>
      </article>`;
    anchor.insertAdjacentElement("afterend", section);
  }

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

  function powerLabel(score) {
    if (score >= 81) return ["EXCEPTIONAL", "YES · STRONG FLEXIBLE-LOAD CONDITIONS"];
    if (score >= 61) return ["FAVOURABLE", "YES · CONDITIONS ARE ATTRACTIVE"];
    if (score >= 41) return ["NORMAL", "WATCH · CONDITIONS ARE MIXED"];
    if (score >= 21) return ["EXPENSIVE", "WAIT · POWER CONDITIONS ARE UNFAVOURABLE"];
    return ["VERY EXPENSIVE", "NO · HIGH-COST POWER CONDITIONS"];
  }

  function renderPowerIndex(metrics, indicators) {
    const energy = indicators.energyCondition;
    const grid = indicators.gridFlexibility;
    const carbon = indicators.lowCarbonCompute;
    const parts = [energy, grid, carbon].filter((x) => x?.available && Number.isFinite(Number(x.score)));
    if (!parts.length) return;
    const weights = parts.length === 3 ? [0.45, 0.35, 0.20] : parts.map(() => 1 / parts.length);
    const score = Math.round(parts.reduce((sum, item, index) => sum + Number(item.score) * weights[index], 0));
    const [state, action] = powerLabel(score);
    text("cobraPowerIndex", number(score));
    text("cobraPowerState", state);
    text("cobraPowerAction", action);

    const market = metrics.market_index_price;
    const surplus = metrics.forecast_surplus;
    const carbonMetric = metrics.carbon_intensity;
    const reasons = [];
    if (market) reasons.push(`${Number(market.value) < 80 ? "✓" : Number(market.value) < 130 ? "△" : "!"} Wholesale ${gbp(market.value)}/MWh (${number(Number(market.value) / 10, 2)}p/kWh equivalent)`);
    if (surplus) reasons.push(`${Number(surplus.value) > 5000 ? "✓" : "△"} Forecast flexibility/surplus signal ${number(surplus.value)} MW`);
    if (carbonMetric) reasons.push(`${Number(carbonMetric.value) < 125 ? "✓" : "△"} Carbon intensity ${number(carbonMetric.value)} gCO₂/kWh`);
    const target = $("cobraPowerReasons");
    if (target) target.innerHTML = reasons.map((r) => `<span>${r}</span>`).join("");
  }

  function renderGridBalance(metrics) {
    const surplus = metrics.forecast_surplus;
    if (!surplus || !Number.isFinite(Number(surplus.value))) return;
    const mw = Number(surplus.value);
    const gw = mw / 1000;
    let state = "TIGHT";
    let explanation = "Available headroom is limited; flexible consumption should be treated cautiously.";
    if (mw >= 10000) { state = "HIGH SURPLUS"; explanation = "Strong forecast headroom: conditions are supportive of flexible electricity consumption."; }
    else if (mw >= 5000) { state = "SURPLUS"; explanation = "Positive forecast headroom: flexible electricity consumption conditions are relatively favourable."; }
    else if (mw >= 1000) { state = "BALANCED"; explanation = "The system has positive headroom, but not an unusually large surplus signal."; }
    text("cobraBalanceValue", `${gw >= 0 ? "+" : ""}${number(gw, 1)} GW`);
    text("cobraBalanceState", state);
    text("cobraBalanceExplanation", explanation);
    const marker = $("cobraBalanceMarker");
    if (marker) marker.style.left = `${Math.max(3, Math.min(97, 50 + (mw / 20000) * 45))}%`;
  }

  function drawEnergyChart(rows) {
    const target = $("cobraEnergyChart");
    if (!target) return;
    const points = rows.map((row) => ({
      value: Number(row.value ?? row.payload?.value),
      time: row.observed_at || row.observedAt || row.timestamp || row.time,
    })).filter((row) => Number.isFinite(row.value));
    if (points.length < 2) {
      target.innerHTML = '<div class="v2-empty">Price history is still accumulating. Live market price is available above.</div>';
      return;
    }
    points.sort((a,b) => new Date(a.time || 0) - new Date(b.time || 0));
    const values = points.map((p) => p.value);
    const min = Math.min(...values), max = Math.max(...values), avg = values.reduce((a,b)=>a+b,0)/values.length;
    const current = values[values.length - 1];
    const first = values[0];
    const movement = first !== 0 ? ((current - first) / Math.abs(first)) * 100 : 0;
    const width = 900, height = 220, pad = 18, range = Math.max(1, max - min);
    const coords = points.map((p, i) => {
      const x = pad + (i / (points.length - 1)) * (width - pad * 2);
      const y = height - pad - ((p.value - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    target.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="GB wholesale electricity price history"><line x1="${pad}" y1="${(height/2).toFixed(1)}" x2="${width-pad}" y2="${(height/2).toFixed(1)}" class="cobra-chart-gridline"/><polyline points="${coords}" class="cobra-chart-line" vector-effect="non-scaling-stroke"/></svg>`;
    text("cobraPriceMovement", `${movement <= 0 ? "↓" : "↑"} ${number(Math.abs(movement), 1)}%`);
    text("cobraPriceAverage", `24H avg ${gbp(avg)}/MWh`);
    text("cobraChartLow", `LOW ${gbp(min)}`);
    text("cobraChartCurrent", `NOW ${gbp(current)}`);
    text("cobraChartHigh", `HIGH ${gbp(max)}`);
  }

  async function loadEnergyHistory() {
    try {
      const response = await fetch("/api/v1/history?metric=market_index_price&region=GB&hours=24&limit=96", { headers:{Accept:"application/json"} });
      if (!response.ok) throw new Error("history_unavailable");
      const data = await response.json();
      const rows = Array.isArray(data) ? data : (data.observations || data.data || data.rows || data.items || []);
      drawEnergyChart(rows);
    } catch {
      const target = $("cobraEnergyChart");
      if (target) target.innerHTML = '<div class="v2-empty">Historical price series is unavailable right now; live wholesale pricing remains active.</div>';
    }
  }

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
    ensureEnergyIntelligenceSurface();
    try {
      const response = await fetch("/api/v1/status", { headers:{Accept:"application/json"} });
      if (!response.ok) throw new Error("status_unavailable");
      const data = await response.json();
      const metrics = metricMap(data.connectors || []);
      latestMetrics = metrics;
      const indicators = data.indicators?.indicators || {};
      latestIndicators = indicators;
      text("v2DataStatus", `${String(data.status||"unknown").toUpperCase()} · ${number(data.summary?.operational)}/${number(data.summary?.connected)} LIVE SOURCES`);
      text("v2CheckedAt", data.checkedAt ? `Updated ${new Date(data.checkedAt).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}` : "");
      setIndicator("indicatorEnergy", indicators.energyCondition);
      setIndicator("indicatorGrid", indicators.gridFlexibility);
      setIndicator("indicatorBitcoin", indicators.bitcoinNetwork);
      setIndicator("indicatorMining", indicators.miningEconomics);
      setIndicator("indicatorCarbon", indicators.lowCarbonCompute);
      setIndicator("indicatorWindow", indicators.computeWindow);
      renderEnergy(metrics); renderBitcoin(metrics); renderPowerIndex(metrics, indicators); renderGridBalance(metrics); simulateMining();
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
  loadIntelligence(); loadEnergyHistory(); window.setInterval(loadIntelligence,60000); window.setInterval(loadEnergyHistory,300000);
})();
