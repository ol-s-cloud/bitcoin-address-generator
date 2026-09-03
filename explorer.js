(() => {
  const LOG_KEY = "cobra-public-address-log-v1";
  const blockchainAddressUrl = (address) =>
    `https://www.blockchain.com/explorer/addresses/btc/${encodeURIComponent(address)}`;
  const mempoolBlockUrl = (hash) =>
    `https://mempool.space/block/${encodeURIComponent(hash)}`;
  const mempoolTransactionUrl = (txid) =>
    `https://mempool.space/tx/${encodeURIComponent(txid)}`;

  const getLog = () => {
    try {
      const value = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };

  const escapeHtml = (value = "") =>
    String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[character],
    );

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };

  const relativeTime = (value) => {
    const timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp)) return "—";
    const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const formatCurrency = (value, compact = false) =>
    Number.isFinite(Number(value))
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: compact ? 1 : 2,
          notation: compact ? "compact" : "standard",
        }).format(Number(value))
      : "—";

  const formatNumber = (value, compact = false) =>
    Number.isFinite(Number(value))
      ? new Intl.NumberFormat("en-US", {
          maximumFractionDigits: compact ? 1 : 0,
          notation: compact ? "compact" : "standard",
        }).format(Number(value))
      : "—";

  const formatHashRate = (ghPerSecond) => {
    const value = Number(ghPerSecond);
    if (!Number.isFinite(value)) return "—";
    return `${(value / 1e9).toFixed(1)} EH/s`;
  };

  const formatBtc = (sats) => {
    const value = Number(sats);
    if (!Number.isFinite(value)) return "—";
    return `${(value / 100_000_000).toLocaleString("en-US", {
      maximumFractionDigits: 4,
    })} BTC`;
  };

  const formatBytes = (value) => {
    const bytes = Number(value);
    if (!Number.isFinite(bytes)) return "—";
    if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2)} MB`;
    if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} kB`;
    return `${bytes} B`;
  };

  const shortHash = (value) => {
    const text = String(value || "");
    return text.length > 24 ? `${text.slice(0, 12)}…${text.slice(-10)}` : text;
  };

  const chartMarkup = (values, formatter) => {
    if (!Array.isArray(values) || values.length < 2) {
      return '<div class="chart-loading">Chart data is temporarily unavailable.</div>';
    }
    const pointsData = values
      .map((point) => ({ x: Number(point.x), y: Number(point.y) }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (pointsData.length < 2) {
      return '<div class="chart-loading">Chart data is temporarily unavailable.</div>';
    }

    const width = 720;
    const height = 235;
    const inset = 5;
    const numbers = pointsData.map((point) => point.y);
    const minimum = Math.min(...numbers);
    const maximum = Math.max(...numbers);
    const range = maximum - minimum || 1;
    const points = pointsData.map((point, index) => ({
      x: inset + (index / (pointsData.length - 1)) * (width - inset * 2),
      y: inset + ((maximum - point.y) / range) * (height - inset * 2),
      timestamp: point.x,
      value: point.y,
    }));
    const path = points
      .map(
        (point, index) =>
          `${index ? "L" : "M"}${point.x.toFixed(2)},${point.y.toFixed(2)}`,
      )
      .join(" ");
    const area = `${path} L${points.at(-1).x.toFixed(2)},${height} L${points[0].x.toFixed(2)},${height} Z`;
    const hoverTargets = points
      .map((point) => {
        const date = new Date(point.timestamp * 1000).toLocaleDateString(
          "en-GB",
          { day: "numeric", month: "short", year: "numeric" },
        );
        return `<circle class="chart-hit" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="10"><title>${escapeHtml(date)} · ${escapeHtml(formatter(point.value))}</title></circle>`;
      })
      .join("");
    const firstDate = new Date(pointsData[0].x * 1000).toLocaleDateString(
      "en-GB",
      { day: "numeric", month: "short" },
    );
    const lastDate = new Date(pointsData.at(-1).x * 1000).toLocaleDateString(
      "en-GB",
      { day: "numeric", month: "short" },
    );
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Values from ${escapeHtml(formatter(minimum))} to ${escapeHtml(formatter(maximum))}"><line class="chart-baseline" x1="0" y1="${height - 1}" x2="${width}" y2="${height - 1}"></line><path class="chart-area" d="${area}"></path><path class="chart-line" d="${path}"></path>${hoverTargets}</svg><div class="chart-labels"><span>${firstDate}</span><span>${escapeHtml(formatter(minimum))} — ${escapeHtml(formatter(maximum))}</span><span>${lastDate}</span></div>`;
  };

  const average = (values) => {
    if (!Array.isArray(values) || !values.length) return NaN;
    return (
      values.reduce((sum, point) => sum + Number(point.y || 0), 0) /
      values.length
    );
  };

  async function loadRegistryData() {
    try {
      const response = await fetch("/api/registry?limit=12", {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Registry unavailable");
      const state = await response.json();
      renderRegistry(state);
    } catch {
      renderLocalFallback();
    }
  }

  function renderRegistry(state) {
    const metrics = state?.metrics || {};
    setText("cobraAddressCount", formatNumber(metrics.addressesCreated));
    setText("cobraPrivateCount", formatNumber(metrics.privateCreations));
    setText("cobraPublicCount", formatNumber(metrics.publicAddresses));
    setText("cobraVoteCount", formatNumber(metrics.globalVotes));
    setText("cobraLastCreated", relativeTime(metrics.lastCreatedAt));
    setText("registryStatus", "COBRA METRICS · LIVE REGISTRY");

    const addresses = Array.isArray(state?.recentAddresses)
      ? state.recentAddresses
      : [];
    renderAddresses(addresses);
  }

  function renderLocalFallback() {
    const log = getLog();
    setText("cobraAddressCount", formatNumber(log.length));
    setText("cobraPrivateCount", "—");
    setText("cobraPublicCount", formatNumber(log.length));
    setText("cobraVoteCount", "—");
    setText("cobraLastCreated", log[0] ? relativeTime(log[0].createdAt) : "—");
    setText("registryStatus", "COBRA METRICS · LOCAL FALLBACK");
    renderAddresses(log);
  }

  function renderAddresses(addresses) {
    const list = document.getElementById("cobraAddressList");
    if (!list) return;
    if (!addresses.length) {
      list.innerHTML =
        '<div class="address-empty">No public COBRA addresses have been shared yet.</div>';
      return;
    }

    list.innerHTML = addresses
      .slice(0, 12)
      .map((item) => {
        const published =
          item.published_at || item.publishedAt || item.createdAt;
        const type = item.address_type || item.type || "P2PKH mainnet";
        return `<article class="address-row"><div><strong>${escapeHtml(item.address)}</strong><small>${escapeHtml(type)} · ${relativeTime(published)}</small></div><a href="${blockchainAddressUrl(item.address)}" target="_blank" rel="noopener noreferrer">Inspect ↗</a></article>`;
      })
      .join("");
  }

  async function loadBitcoinData() {
    try {
      const response = await fetch("/api/bitcoin", {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Bitcoin data unavailable");
      const data = await response.json();
      const market = data.market || {};
      const network = data.network || {};
      const change = Number(market.change24hPercent || 0);

      setText("btcPrice", formatCurrency(market.priceUsd));
      setText("high24h", formatCurrency(market.high24hUsd));
      setText("low24h", formatCurrency(market.low24hUsd));
      setText("change24h", `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`);
      const changeElement = document.getElementById("change24h");
      changeElement?.classList.toggle("positive", change >= 0);
      changeElement?.classList.toggle("negative", change < 0);
      setText("marketCap", formatCurrency(market.marketCapUsd, true));
      setText(
        "circulatingSupply",
        `${formatNumber(market.circulatingSupplyBtc, true)} / ${formatNumber(market.maxSupplyBtc, true)}`,
      );
      setText("algorithm", network.algorithm || "SHA-256");
      setText("blockHeight", formatNumber(network.blockHeight));
      setText(
        "blockReward",
        `${Number(network.blockRewardBtc).toFixed(3)} BTC`,
      );
      setText("difficulty", formatNumber(network.difficulty, true));
      setText("transactions24h", formatNumber(network.transactions24h));
      setText("hashRate", formatHashRate(network.hashRateGh));
      setText(
        "blockTime",
        `${Number(network.averageBlockMinutes).toFixed(1)} min`,
      );
      setText(
        "marketUpdated",
        `Updated ${relativeTime(data.updatedAt)} · live mainnet sources`,
      );
      setText(
        "mempoolSummary",
        `${formatNumber(network.mempoolTransactions)} transactions waiting · ${formatNumber(network.fastestFeeSatVb)} sat/vB priority fee`,
      );

      const prices = data.charts?.marketPrice || [];
      setText(
        "priceChange",
        `${change >= 0 ? "+" : ""}${change.toFixed(2)}% / 24h`,
      );
      document.getElementById("priceChart").innerHTML = chartMarkup(
        prices,
        (value) => formatCurrency(value, true),
      );

      const transactions = data.charts?.transactions || [];
      setText("txAverage", `${formatNumber(average(transactions))} daily avg`);
      document.getElementById("txChart").innerHTML = chartMarkup(
        transactions,
        (value) => formatNumber(value),
      );

      const hashRate = data.charts?.hashRate || [];
      setText("hashAverage", `${formatHashRate(average(hashRate))} avg`);
      document.getElementById("hashRateChart").innerHTML = chartMarkup(
        hashRate,
        (value) => formatHashRate(value),
      );

      const volume = data.charts?.transactionVolumeUsd || [];
      setText("volumeAverage", `${formatCurrency(average(volume), true)} avg`);
      document.getElementById("volumeChart").innerHTML = chartMarkup(
        volume,
        (value) => formatCurrency(value, true),
      );

      renderBlocks(data.latestBlocks || []);
      renderTransactions(data.latestTransactions || []);
    } catch {
      setText("marketUpdated", "Live data is temporarily unavailable");
      setText("mempoolSummary", "Bitcoin mainnet feed is reconnecting…");
      for (const id of [
        "priceChart",
        "txChart",
        "hashRateChart",
        "volumeChart",
      ]) {
        const target = document.getElementById(id);
        if (target) {
          target.innerHTML =
            '<div class="chart-loading">Open a linked explorer for the latest data.</div>';
        }
      }
      renderBlocks([]);
      renderTransactions([]);
    }
  }

  function renderBlocks(blocks) {
    const target = document.getElementById("latestBlocks");
    if (!target) return;
    if (!Array.isArray(blocks) || !blocks.length) {
      target.innerHTML =
        '<div class="chart-loading">Latest blocks are temporarily unavailable.</div>';
      return;
    }
    target.innerHTML = blocks
      .slice(0, 6)
      .map(
        (block) =>
          `<a class="stream-row" href="${mempoolBlockUrl(block.id)}" target="_blank" rel="noopener noreferrer"><div><strong>Block #${formatNumber(block.height)}</strong><small>${relativeTime(Number(block.timestamp) * 1000)} · ${escapeHtml(block.pool)}</small></div><span>${formatNumber(block.transactionCount)} tx<br />${formatBytes(block.size)}</span></a>`,
      )
      .join("");
  }

  function renderTransactions(transactions) {
    const target = document.getElementById("latestTransactions");
    if (!target) return;
    if (!Array.isArray(transactions) || !transactions.length) {
      target.innerHTML =
        '<div class="chart-loading">Latest transactions are temporarily unavailable.</div>';
      return;
    }
    target.innerHTML = transactions
      .slice(0, 6)
      .map((transaction) => {
        const feeRate = Number(transaction.vsize)
          ? Number(transaction.feeSats) / Number(transaction.vsize)
          : 0;
        return `<a class="stream-row" href="${mempoolTransactionUrl(transaction.txid)}" target="_blank" rel="noopener noreferrer"><div><strong>${escapeHtml(shortHash(transaction.txid))}</strong><small>${formatNumber(transaction.feeSats)} sat fee · ${feeRate.toFixed(1)} sat/vB</small></div><span>${formatBtc(transaction.valueSats)}<br />unconfirmed</span></a>`;
      })
      .join("");
  }

  document
    .getElementById("addressSearchForm")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = document.getElementById("addressSearch");
      const error = document.getElementById("addressSearchError");
      const address = input.value.trim();
      const looksLikeMainnet =
        /^(1|3)[a-km-zA-HJ-NP-Z1-9]{24,34}$/.test(address) ||
        /^bc1[ac-hj-np-z02-9]{11,87}$/i.test(address);
      if (!looksLikeMainnet) {
        error.textContent = "Enter a valid-looking Bitcoin mainnet address.";
        return;
      }
      error.textContent = "";
      window.open(
        blockchainAddressUrl(address),
        "_blank",
        "noopener,noreferrer",
      );
    });

  loadRegistryData();
  loadBitcoinData();
  setInterval(loadRegistryData, 60_000);
  setInterval(loadBitcoinData, 300_000);
})();
