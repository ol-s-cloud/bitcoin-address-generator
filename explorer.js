(() => {
  const LOG_KEY = "cobra-public-address-log-v1";
  const explorerUrl = (address) =>
    `https://www.blockchain.com/explorer/addresses/btc/${encodeURIComponent(address)}`;

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

  const relativeTime = (value) => {
    const timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp)) return "Unknown";
    const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const renderLocalMetrics = () => {
    const log = getLog();
    document.getElementById("cobraAddressCount").textContent = String(log.length);
    document.getElementById("cobraPrivateCount").textContent = String(log.length);
    document.getElementById("cobraPublicCount").textContent = "0";
    document.getElementById("cobraLastCreated").textContent = log[0]
      ? relativeTime(log[0].createdAt)
      : "—";

    const list = document.getElementById("cobraAddressList");
    if (!log.length) {
      list.innerHTML =
        '<div class="address-empty">No COBRA addresses have been created on this device yet.</div>';
      return;
    }

    list.innerHTML = log
      .slice(0, 8)
      .map(
        (item) => `<article class="address-row"><div><strong>${escapeHtml(item.address)}</strong><small>${escapeHtml(item.type || "P2PKH mainnet")} · ${relativeTime(item.createdAt)}</small></div><a href="${explorerUrl(item.address)}" target="_blank" rel="noopener noreferrer">Inspect ↗</a></article>`,
      )
      .join("");
  };

  const formatCurrency = (value, compact = false) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: compact ? 0 : 2,
      notation: compact ? "compact" : "standard",
    }).format(value);

  const formatNumber = (value) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);

  const formatHashRate = (ghPerSecond) => {
    if (!Number.isFinite(ghPerSecond)) return "—";
    return `${(ghPerSecond / 1e9).toFixed(1)} EH/s`;
  };

  const chartMarkup = (values, formatter) => {
    if (!Array.isArray(values) || values.length < 2) {
      return '<div class="chart-loading">Chart data is temporarily unavailable.</div>';
    }
    const width = 720;
    const height = 235;
    const inset = 5;
    const numbers = values.map((point) => Number(point.y));
    const minimum = Math.min(...numbers);
    const maximum = Math.max(...numbers);
    const range = maximum - minimum || 1;
    const points = values.map((point, index) => {
      const x = inset + (index / (values.length - 1)) * (width - inset * 2);
      const y = inset + ((maximum - Number(point.y)) / range) * (height - inset * 2);
      return [x, y];
    });
    const path = points
      .map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`)
      .join(" ");
    const area = `${path} L${points.at(-1)[0].toFixed(2)},${height} L${points[0][0].toFixed(2)},${height} Z`;
    const firstDate = new Date(Number(values[0].x) * 1000).toLocaleDateString(
      "en-GB",
      { day: "numeric", month: "short" },
    );
    const lastDate = new Date(Number(values.at(-1).x) * 1000).toLocaleDateString(
      "en-GB",
      { day: "numeric", month: "short" },
    );
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Values from ${formatter(minimum)} to ${formatter(maximum)}"><line class="chart-baseline" x1="0" y1="${height - 1}" x2="${width}" y2="${height - 1}"></line><path class="chart-area" d="${area}"></path><path class="chart-line" d="${path}"></path></svg><div class="chart-labels"><span>${firstDate}</span><span>${formatter(minimum)} — ${formatter(maximum)}</span><span>${lastDate}</span></div>`;
  };

  async function loadBitcoinData() {
    try {
      const response = await fetch("/api/bitcoin", {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Bitcoin data unavailable");
      const data = await response.json();

      document.getElementById("btcPrice").textContent = formatCurrency(
        data.market.priceUsd,
      );
      document.getElementById("marketCap").textContent = formatCurrency(
        data.market.marketCapUsd,
        true,
      );
      document.getElementById("blockHeight").textContent = formatNumber(
        data.network.blockHeight,
      );
      document.getElementById("transactions24h").textContent = formatNumber(
        data.network.transactions24h,
      );
      document.getElementById("hashRate").textContent = formatHashRate(
        data.network.hashRateGh,
      );
      document.getElementById("blockTime").textContent = `${Number(data.network.averageBlockMinutes).toFixed(1)} min`;
      document.getElementById("marketUpdated").textContent =
        `Updated ${relativeTime(data.updatedAt)} · Blockchain.com`;

      const prices = data.charts.marketPrice;
      const firstPrice = Number(prices[0]?.y);
      const lastPrice = Number(prices.at(-1)?.y);
      const change = firstPrice
        ? ((lastPrice - firstPrice) / firstPrice) * 100
        : 0;
      document.getElementById("priceChange").textContent =
        `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
      document.getElementById("priceChart").innerHTML = chartMarkup(
        prices,
        (value) => formatCurrency(value, true),
      );

      const transactions = data.charts.transactions;
      const transactionAverage =
        transactions.reduce((sum, point) => sum + Number(point.y), 0) /
        Math.max(1, transactions.length);
      document.getElementById("txAverage").textContent =
        `${formatNumber(transactionAverage)} daily avg`;
      document.getElementById("txChart").innerHTML = chartMarkup(
        transactions,
        (value) => formatNumber(value),
      );
    } catch {
      document.getElementById("marketUpdated").textContent =
        "Live data is temporarily unavailable";
      for (const id of ["priceChart", "txChart"]) {
        document.getElementById(id).innerHTML =
          '<div class="chart-loading">Open Blockchain.com Explorer for the latest data.</div>';
      }
    }
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
      window.open(explorerUrl(address), "_blank", "noopener,noreferrer");
    });

  renderLocalMetrics();
  loadBitcoinData();
  setInterval(renderLocalMetrics, 30000);
  setInterval(loadBitcoinData, 300000);
})();
