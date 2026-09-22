(() => {
  const $ = (id) => document.getElementById(id);
  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]);
  const formatNumber = (value, compact = false) => Number.isFinite(Number(value)) ? new Intl.NumberFormat("en-GB", { maximumFractionDigits: compact ? 1 : 0, notation: compact ? "compact" : "standard" }).format(Number(value)) : "—";
  const formatUsd = (value, compact = false) => Number.isFinite(Number(value)) ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: compact ? 1 : 2, notation: compact ? "compact" : "standard" }).format(Number(value)) : "—";
  const formatGbp = (value, digits = 2) => Number.isFinite(Number(value)) ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: digits }).format(Number(value)) : "—";
  const relativeTime = (value) => {
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) return "—";
    const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };
  const shortHash = (value) => {
    const text = String(value || "");
    return text.length > 24 ? `${text.slice(0, 12)}…${text.slice(-10)}` : text;
  };
  const formatHashRate = (gh) => Number.isFinite(Number(gh)) ? `${(Number(gh) / 1e9).toFixed(1)} EH/s` : "—";
  const average = (rows = []) => rows.length ? rows.reduce((sum, row) => sum + Number(row.y || 0), 0) / rows.length : NaN;

  function chartMarkup(rows = [], formatter = (v) => String(v)) {
    const data = rows.map((point) => ({ x: Number(point.x), y: Number(point.y) })).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (data.length < 2) return '<div class="depth-empty">Chart data unavailable.</div>';
    const width = 720, height = 220, inset = 6;
    const values = data.map((point) => point.y), min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
    const points = data.map((point, index) => ({
      x: inset + (index / (data.length - 1)) * (width - inset * 2),
      y: inset + ((max - point.y) / range) * (height - inset * 2),
    }));
    const path = points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
    const area = `${path} L${points.at(-1).x.toFixed(2)},${height} L${points[0].x.toFixed(2)},${height} Z`;
    return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img"><path class="depth-chart-area" d="${area}"></path><path class="depth-chart-line" d="${path}"></path></svg><div class="depth-chart-labels"><span>${escapeHtml(formatter(min))}</span><span>${escapeHtml(formatter(max))}</span></div>`;
  }

  function buildLiveStrip() {
    const context = document.querySelector(".terminal-context");
    if (!context || $("cobraLiveStrip")) return;
    const section = document.createElement("section");
    section.id = "cobraLiveStrip";
    section.className = "cobra-live-strip";
    section.innerHTML = `
      <article><span>BTC / USD</span><strong id="depthBtcUsd">—</strong><small id="depthBtcChange">Live market</small></article>
      <article><span>BTC / GBP</span><strong id="depthBtcGbp">—</strong><small>COBRA conversion feed</small></article>
      <article><span>GB WHOLESALE</span><strong id="depthPowerGbpMwh">—</strong><small id="depthPowerPence">System reference · not retail tariff</small></article>
      <article><span>GRID LOCATION</span><strong>GB SYSTEM</strong><small>Regional / site tariffs require a site data source</small></article>`;
    context.insertAdjacentElement("afterend", section);
  }

  function buildMiningDepth() {
    const panel = document.querySelector('[data-panel="mining"]');
    if (!panel || $("bitcoinDepth")) return;
    const section = document.createElement("section");
    section.id = "bitcoinDepth";
    section.className = "bitcoin-depth";
    section.innerHTML = `
      <div class="depth-heading"><div><div class="eyebrow">BITCOIN MARKET + NETWORK</div><h2>Live mainnet intelligence.</h2></div><p id="depthBitcoinUpdated">Connecting to Bitcoin data…</p></div>
      <div class="depth-metrics">
        <article><span>BTC / USD</span><strong id="depthPrice">—</strong></article>
        <article><span>24H HIGH</span><strong id="depthHigh">—</strong></article>
        <article><span>24H LOW</span><strong id="depthLow">—</strong></article>
        <article><span>24H CHANGE</span><strong id="depthChange">—</strong></article>
        <article><span>MARKET CAP</span><strong id="depthMarketCap">—</strong></article>
        <article><span>BLOCK HEIGHT</span><strong id="depthHeight">—</strong></article>
        <article><span>DIFFICULTY</span><strong id="depthDifficulty">—</strong></article>
        <article><span>HASH RATE</span><strong id="depthHash">—</strong></article>
        <article><span>BLOCK REWARD</span><strong id="depthReward">—</strong></article>
        <article><span>AVG BLOCK TIME</span><strong id="depthBlockTime">—</strong></article>
        <article><span>TX · 24H</span><strong id="depthTx24">—</strong></article>
        <article><span>MEMPOOL</span><strong id="depthMempool">—</strong></article>
      </div>
      <div class="depth-chart-grid">
        <article><header><div><span>30 DAYS</span><h3>BTC market price</h3></div><strong id="depthPriceAvg">—</strong></header><div class="depth-chart" id="depthPriceChart"><div class="depth-empty">Loading…</div></div></article>
        <article><header><div><span>30 DAYS</span><h3>Confirmed transactions</h3></div><strong id="depthTxAvg">—</strong></header><div class="depth-chart" id="depthTxChart"><div class="depth-empty">Loading…</div></div></article>
        <article><header><div><span>30 DAYS</span><h3>Network hash rate</h3></div><strong id="depthHashAvg">—</strong></header><div class="depth-chart" id="depthHashChart"><div class="depth-empty">Loading…</div></div></article>
        <article><header><div><span>30 DAYS</span><h3>Transaction volume</h3></div><strong id="depthVolumeAvg">—</strong></header><div class="depth-chart" id="depthVolumeChart"><div class="depth-empty">Loading…</div></div></article>
      </div>
      <div class="depth-stream-grid">
        <article class="depth-stream"><header><h3>Latest blocks</h3><span>CONFIRMED</span></header><div id="depthBlocks"><div class="depth-empty">Loading blocks…</div></div></article>
        <article class="depth-stream"><header><h3>Latest transactions</h3><span>MEMPOOL</span></header><div id="depthTransactions"><div class="depth-empty">Loading transactions…</div></div></article>
      </div>`;
    panel.appendChild(section);
  }

  function buildPersistentFooter() {
    const main = document.querySelector("main.terminal-shell");
    if (!main || $("cobraPersistentFooter")) return;
    const section = document.createElement("section");
    section.id = "cobraPersistentFooter";
    section.className = "cobra-persistent-footer";
    section.innerHTML = `
      <section class="persistent-block">
        <div class="depth-heading"><div><div class="eyebrow" id="depthRegistryStatus">COBRA METRICS · CONNECTING</div><h2>Live registry.</h2></div><a href="/#tools">Create an address →</a></div>
        <div class="depth-metrics registry-metrics">
          <article><span>ADDRESSES CREATED</span><strong id="depthAddressCount">—</strong></article>
          <article><span>PRIVATE / DEVICE-ONLY</span><strong id="depthPrivateCount">—</strong></article>
          <article><span>SHARED PUBLICLY</span><strong id="depthPublicCount">—</strong></article>
          <article><span>GLOBAL POLL VOTES</span><strong id="depthVoteCount">—</strong></article>
          <article><span>LAST CREATED</span><strong id="depthLastCreated">—</strong></article>
        </div>
        <div class="registry-addresses" id="depthAddressList"><div class="depth-empty">Loading public registry…</div></div>
      </section>
      <section class="persistent-block">
        <div class="depth-heading"><div><div class="eyebrow">COBRA ECOSYSTEM</div><h2>Explore the system.</h2></div></div>
        <div class="depth-ecosystem">
          <a href="/offline.html"><span>01</span><strong>Offline</strong><small>Operate without continuous connectivity.</small></a>
          <a href="/cli.html"><span>02</span><strong>CLI</strong><small>Run COBRA from the command line.</small></a>
          <a href="/research.html"><span>03</span><strong>Research</strong><small>Open technical and scientific work.</small></a>
          <a href="/docs.html"><span>04</span><strong>Docs</strong><small>Architecture, APIs and implementation.</small></a>
          <a href="/explorer.html"><span>05</span><strong>Legacy Explorer</strong><small>Current Bitcoin-first production explorer.</small></a>
        </div>
      </section>
      <section class="persistent-block">
        <div class="depth-heading"><div><div class="eyebrow">COBRA POLLS</div><h2>Help decide what ships next.</h2></div></div>
        <div class="depth-polls">
          <article><h3>Which network should COBRA support next?</h3><p id="depthNetworkPollState">Connecting…</p><div id="depthNetworkPoll"></div></article>
          <article><h3>Which capability should COBRA prioritise?</h3><p id="depthFeaturePollState">Connecting…</p><div id="depthFeaturePoll"></div></article>
        </div>
      </section>`;
    main.appendChild(section);
  }

  function buildAskCobra() {
    if ($("askCobraDock")) return;
    const dock = document.createElement("aside");
    dock.id = "askCobraDock";
    dock.className = "ask-cobra-dock";
    dock.innerHTML = `
      <button class="ask-cobra-trigger" id="askCobraTrigger" type="button" aria-expanded="false">ASK COBRA</button>
      <div class="ask-cobra-panel" id="askCobraPanel" hidden>
        <div class="ask-cobra-head"><div><span>DETERMINISTIC · LIVE GB DATA</span><strong>Ask COBRA</strong></div><button id="askCobraClose" type="button" aria-label="Close Ask COBRA">×</button></div>
        <p>Ask about current power, grid, carbon, mining or compute conditions.</p>
        <form id="askCobraForm"><input id="askCobraInput" autocomplete="off" placeholder="Is this a good time to run flexible compute?"/><button type="submit">Ask</button></form>
        <div class="ask-cobra-answer" id="askCobraAnswer">COBRA will answer from the live indicator engine and explain the data it used.</div>
      </div>`;
    document.body.appendChild(dock);
    const trigger = $("askCobraTrigger"), panel = $("askCobraPanel");
    const setOpen = (open) => { panel.hidden = !open; trigger.setAttribute("aria-expanded", String(open)); };
    trigger.addEventListener("click", () => setOpen(panel.hidden));
    $("askCobraClose").addEventListener("click", () => setOpen(false));
    $("askCobraForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const question = $("askCobraInput").value.trim();
      if (!question) return;
      $("askCobraAnswer").textContent = "Reading live COBRA indicators…";
      try {
        const response = await fetch(`/api/v1/ask?q=${encodeURIComponent(question)}`, { headers: { Accept: "application/json" } });
        const data = await response.json();
        const answer = data.answer || data.response || data.summary || data.message || "COBRA returned a structured result, but no answer text was available.";
        const reasons = Array.isArray(data.reasons) ? data.reasons : Array.isArray(data.drivers) ? data.drivers : [];
        $("askCobraAnswer").innerHTML = `<strong>${escapeHtml(answer)}</strong>${reasons.length ? `<ul>${reasons.slice(0,4).map((item) => `<li>${escapeHtml(typeof item === "string" ? item : item.label || item.text || JSON.stringify(item))}</li>`).join("")}</ul>` : ""}`;
      } catch {
        $("askCobraAnswer").textContent = "Ask COBRA is temporarily unavailable.";
      }
    });
  }

  async function loadStatus() {
    try {
      const response = await fetch("/api/v1/status", { headers: { Accept: "application/json" } });
      if (!response.ok) return;
      const data = await response.json();
      const map = Object.fromEntries((data.connectors || []).filter((item) => item?.metric?.code).map((item) => [item.metric.code, item.metric]));
      const market = Number(map.market_index_price?.value);
      const btc = map.bitcoin_network_state;
      if (Number.isFinite(market)) {
        $("depthPowerGbpMwh").textContent = `${formatGbp(market)}/MWh`;
        $("depthPowerPence").textContent = `${(market / 10).toFixed(2)}p/kWh wholesale equivalent · GB system`;
      }
      if (btc?.priceGbp) $("depthBtcGbp").textContent = formatGbp(btc.priceGbp, 0);
    } catch {}
  }

  async function loadBitcoin() {
    try {
      const response = await fetch("/api/bitcoin", { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Bitcoin unavailable");
      const data = await response.json(), market = data.market || {}, network = data.network || {}, change = Number(market.change24hPercent || 0);
      $("depthBtcUsd").textContent = formatUsd(market.priceUsd);
      $("depthBtcChange").textContent = `${change >= 0 ? "+" : ""}${change.toFixed(2)}% · 24h`;
      $("depthPrice").textContent = formatUsd(market.priceUsd);
      $("depthHigh").textContent = formatUsd(market.high24hUsd);
      $("depthLow").textContent = formatUsd(market.low24hUsd);
      $("depthChange").textContent = `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;
      $("depthMarketCap").textContent = formatUsd(market.marketCapUsd, true);
      $("depthHeight").textContent = formatNumber(network.blockHeight);
      $("depthDifficulty").textContent = formatNumber(network.difficulty, true);
      $("depthHash").textContent = formatHashRate(network.hashRateGh);
      $("depthReward").textContent = Number.isFinite(Number(network.blockRewardBtc)) ? `${Number(network.blockRewardBtc).toFixed(3)} BTC` : "—";
      $("depthBlockTime").textContent = Number.isFinite(Number(network.averageBlockMinutes)) ? `${Number(network.averageBlockMinutes).toFixed(1)} min` : "—";
      $("depthTx24").textContent = formatNumber(network.transactions24h);
      $("depthMempool").textContent = formatNumber(network.mempoolTransactions);
      $("depthBitcoinUpdated").textContent = `Updated ${relativeTime(data.updatedAt)} · live mainnet sources`;
      const prices = data.charts?.marketPrice || [], tx = data.charts?.transactions || [], hash = data.charts?.hashRate || [], volume = data.charts?.transactionVolumeUsd || [];
      $("depthPriceAvg").textContent = `${formatUsd(average(prices), true)} avg`;
      $("depthTxAvg").textContent = `${formatNumber(average(tx))} avg`;
      $("depthHashAvg").textContent = `${formatHashRate(average(hash))} avg`;
      $("depthVolumeAvg").textContent = `${formatUsd(average(volume), true)} avg`;
      $("depthPriceChart").innerHTML = chartMarkup(prices, (v) => formatUsd(v, true));
      $("depthTxChart").innerHTML = chartMarkup(tx, (v) => formatNumber(v, true));
      $("depthHashChart").innerHTML = chartMarkup(hash, (v) => formatHashRate(v));
      $("depthVolumeChart").innerHTML = chartMarkup(volume, (v) => formatUsd(v, true));
      $("depthBlocks").innerHTML = (data.latestBlocks || []).slice(0,6).map((block) => `<a class="depth-stream-row" href="https://mempool.space/block/${encodeURIComponent(block.id)}" target="_blank" rel="noopener noreferrer"><div><strong>Block #${formatNumber(block.height)}</strong><small>${relativeTime(Number(block.timestamp) * 1000)} · ${escapeHtml(block.pool || "Unknown pool")}</small></div><span>${formatNumber(block.transactionCount)} tx</span></a>`).join("") || '<div class="depth-empty">Latest blocks unavailable.</div>';
      $("depthTransactions").innerHTML = (data.latestTransactions || []).slice(0,6).map((txItem) => `<a class="depth-stream-row" href="https://mempool.space/tx/${encodeURIComponent(txItem.txid)}" target="_blank" rel="noopener noreferrer"><div><strong>${escapeHtml(shortHash(txItem.txid))}</strong><small>${formatNumber(txItem.feeSats)} sat fee</small></div><span>${Number.isFinite(Number(txItem.valueSats)) ? `${(Number(txItem.valueSats)/1e8).toFixed(4)} BTC` : "—"}</span></a>`).join("") || '<div class="depth-empty">Latest transactions unavailable.</div>';
    } catch {
      if ($("depthBitcoinUpdated")) $("depthBitcoinUpdated").textContent = "Bitcoin feed temporarily unavailable.";
    }
  }

  async function loadRegistry() {
    try {
      const response = await fetch("/api/registry?limit=6", { credentials: "same-origin", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("registry unavailable");
      const data = await response.json(), metrics = data.metrics || {};
      $("depthAddressCount").textContent = formatNumber(metrics.addressesCreated);
      $("depthPrivateCount").textContent = formatNumber(metrics.privateCreations);
      $("depthPublicCount").textContent = formatNumber(metrics.publicAddresses);
      $("depthVoteCount").textContent = formatNumber(metrics.globalVotes);
      $("depthLastCreated").textContent = relativeTime(metrics.lastCreatedAt);
      $("depthRegistryStatus").textContent = "COBRA METRICS · LIVE REGISTRY";
      const rows = data.recentAddresses || [];
      $("depthAddressList").innerHTML = rows.length ? rows.slice(0,6).map((item) => `<a class="registry-row" href="https://www.blockchain.com/explorer/addresses/btc/${encodeURIComponent(item.address)}" target="_blank" rel="noopener noreferrer"><div><strong>${escapeHtml(item.address)}</strong><small>${escapeHtml(item.address_type || item.type || "P2PKH mainnet")} · ${relativeTime(item.published_at || item.publishedAt || item.createdAt)}</small></div><span>Inspect ↗</span></a>`).join("") : '<div class="depth-empty">No public COBRA addresses shared yet.</div>';
    } catch {
      $("depthRegistryStatus").textContent = "COBRA METRICS · REGISTRY UNAVAILABLE";
    }
  }

  const VOTER_KEY = "cobra-global-voter-id-v1";
  const voterId = () => {
    try {
      let id = localStorage.getItem(VOTER_KEY);
      if (id) return id;
      id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      localStorage.setItem(VOTER_KEY, id);
      return id;
    } catch { return `${Date.now()}-${Math.random()}`; }
  };
  const pollConfigs = {
    "next-network": { target: "depthNetworkPoll", state: "depthNetworkPollState", options: [
      ["ethereum-evm","Ethereum (EVM Ecosystem)"],["solana","Solana"],["litecoin","Litecoin"],["other","Other / Suggest"]
    ]},
    "next-feature": { target: "depthFeaturePoll", state: "depthFeaturePollState", options: [
      ["onchain-privacy","Onchain privacy"],["wallet-systems","Wallet systems"],["cold-storage","Cold-storage integrations"],["cross-border-payments","COBRA cross-border payments"],["offline","Offline functionality"],["api-sdk","Public API & SDK"],["mining-intelligence","COBRA Mining & Intelligence"]
    ]}
  };
  function renderPoll(slug, poll) {
    const config = pollConfigs[slug], target = $(config.target), state = $(config.state); if (!target || !state) return;
    const results = new Map((poll?.options || []).map((item) => [item.slug, item]));
    const total = Number(poll?.totalVotes || 0); state.textContent = `${formatNumber(total)} global vote${total === 1 ? "" : "s"}`;
    target.innerHTML = config.options.map(([optionSlug,label]) => {
      const votes = Number(results.get(optionSlug)?.votes || 0), share = total ? votes / total * 100 : 0;
      return `<button class="depth-poll-option" type="button" data-poll="${slug}" data-choice="${optionSlug}"><span>${escapeHtml(label)}</span><strong>${share.toFixed(total ? 1 : 0)}%</strong><i style="--poll:${share.toFixed(2)}%"></i></button>`;
    }).join("");
  }
  async function loadPolls() {
    try {
      const response = await fetch("/api/polls", { credentials: "same-origin", headers: { Accept: "application/json" } });
      const data = await response.json();
      Object.keys(pollConfigs).forEach((slug) => renderPoll(slug, data.polls?.[slug]));
    } catch {}
  }
  document.addEventListener("click", async (event) => {
    const button = event.target.closest(".depth-poll-option"); if (!button) return;
    button.disabled = true;
    try {
      const response = await fetch("/api/polls", { method: "POST", credentials: "same-origin", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ poll: button.dataset.poll, option: button.dataset.choice, voterId: voterId() }) });
      const data = await response.json();
      Object.keys(pollConfigs).forEach((slug) => renderPoll(slug, data.polls?.[slug]));
    } catch { button.disabled = false; }
  });

  buildLiveStrip();
  buildMiningDepth();
  buildPersistentFooter();
  buildAskCobra();
  loadStatus();
  loadBitcoin();
  loadRegistry();
  loadPolls();
})();