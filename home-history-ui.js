(() => {
  if (!location.pathname.endsWith('/home-dashboard.html')) return;

  const dashboard = document.querySelector('.home-dashboard');
  const overview = document.getElementById('overview');
  if (!dashboard || !overview) return;

  const panel = document.createElement('section');
  panel.className = 'home-history-panel';
  panel.id = 'usage-history';
  panel.innerHTML = `
    <div class="home-history-head">
      <div>
        <div class="home-app-eyebrow">USAGE HISTORY</div>
        <h2>Your household load, in context.</h2>
        <p>COBRA calculates these diagnostics from the interval readings attached to this Home site. Retail-cost estimates use the household tariff where the required rate data is available.</p>
      </div>
      <div class="home-history-range" role="group" aria-label="Usage history range">
        <button type="button" data-days="7">7D</button>
        <button type="button" data-days="30" class="active">30D</button>
        <button type="button" data-days="90">90D</button>
      </div>
    </div>
    <div class="home-history-metrics">
      <article class="home-history-metric"><span>Total use</span><strong id="historyTotal">—</strong><small>Electricity import in selected period</small></article>
      <article class="home-history-metric"><span>Average day</span><strong id="historyAverage">—</strong><small>Average electricity import per covered day</small></article>
      <article class="home-history-metric"><span>Peak demand</span><strong id="historyPeak">—</strong><small>Highest observed interval converted to kW</small></article>
      <article class="home-history-metric"><span>Overnight</span><strong id="historyOvernight">—</strong><small>00:00–04:59 share of imported electricity</small></article>
      <article class="home-history-metric"><span>Estimated cost</span><strong id="historyCost">—</strong><small id="historyCostNote">Requires compatible retail tariff data</small></article>
    </div>
    <div>
      <div class="home-app-eyebrow">DAILY ELECTRICITY IMPORT</div>
      <div id="historyChart" class="home-history-chart" aria-label="Daily electricity import chart"></div>
    </div>
    <div id="historyDiagnostics" class="home-history-diagnostics"></div>
    <div id="historyEmpty" class="home-history-empty" hidden><strong>No interval history yet.</strong><span>Connect a supplier or import interval CSV data to populate this view.</span></div>
    <div id="historyStatus" class="home-history-status"></div>`;

  overview.insertAdjacentElement('afterend', panel);

  document.querySelectorAll('.home-history-range button').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.home-history-range button').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      loadHistory(Number(button.dataset.days || 30));
    });
  });

  loadHistory(30);

  async function loadHistory(days) {
    setText('historyStatus', 'Loading household history…');
    try {
      const response = await fetch(`/api/registry?mode=home_history&days=${encodeURIComponent(days)}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (response.status === 401) return;
      if (!response.ok) throw new Error('history_unavailable');
      const data = await response.json();
      renderHistory(data);
      setText('historyStatus', `${data.summary?.readingCount || 0} interval readings · ${data.summary?.coveredDays || 0} covered days`);
    } catch {
      setText('historyStatus', 'Household history could not be loaded.');
    }
  }

  function renderHistory(data) {
    const summary = data.summary || {};
    const hasHistory = Number(summary.readingCount || 0) > 0;
    const empty = document.getElementById('historyEmpty');
    if (empty) empty.hidden = hasHistory;

    setText('historyTotal', hasHistory ? `${format(summary.electricityImportKwh, 1)} kWh` : '—');
    setText('historyAverage', hasHistory ? `${format(summary.averageDailyElectricityKwh, 1)} kWh` : '—');
    setText('historyPeak', hasHistory ? `${format(summary.peakKw, 2)} kW` : '—');
    setText('historyOvernight', hasHistory ? percent(summary.overnightShare) : '—');
    setText('historyCost', summary.estimatedTotalCostGbp == null ? '—' : currency(summary.estimatedTotalCostGbp));
    setText('historyCostNote', summary.costMethod === 'flat_tariff_estimate' ? 'Flat retail tariff estimate including standing charge where available' : 'Requires compatible retail tariff data');

    renderDaily(data.daily || []);
    renderDiagnostics(data);
  }

  function renderDaily(items) {
    const chart = document.getElementById('historyChart');
    if (!chart) return;
    chart.innerHTML = '';
    const values = items.map((item) => Number(item.electricityImportKwh || 0));
    const max = Math.max(...values, 0);
    items.forEach((item) => {
      const value = Number(item.electricityImportKwh || 0);
      const bar = document.createElement('div');
      bar.className = 'home-history-bar';
      bar.style.height = `${max > 0 ? Math.max(2, (value / max) * 100) : 2}%`;
      bar.dataset.label = `${formatDate(item.day)} · ${format(value, 1)} kWh`;
      bar.setAttribute('aria-label', bar.dataset.label);
      chart.appendChild(bar);
    });
  }

  function renderDiagnostics(data) {
    const node = document.getElementById('historyDiagnostics');
    if (!node) return;
    node.innerHTML = '';
    const summary = data.summary || {};
    if (!summary.readingCount) return;

    addNote(node, 'Evening demand', `${percent(summary.eveningShare)} of imported electricity occurred between 16:00 and 20:59 in this period.`);
    addNote(node, 'Overnight demand', `${format(summary.overnightKwh, 1)} kWh was imported between 00:00 and 04:59. This is exposure, not an assumed saving.`);

    if (summary.estimatedEnergyCostGbp != null) {
      addNote(node, 'Retail cost reconstruction', `${currency(summary.estimatedEnergyCostGbp)} estimated energy charge${summary.estimatedStandingCostGbp != null ? ` + ${currency(summary.estimatedStandingCostGbp)} standing charge` : ''}.`);
    } else {
      addNote(node, 'Retail cost reconstruction', 'COBRA will calculate retail cost once the tariff contains sufficient rate information. Wholesale prices are not substituted for the household tariff.');
    }

    const strongestHour = (data.hourlyProfile || []).reduce((best, item) => !best || Number(item.share) > Number(best.share) ? item : best, null);
    if (strongestHour) addNote(node, 'Highest-use clock hour', `${String(strongestHour.hour).padStart(2, '0')}:00–${String((strongestHour.hour + 1) % 24).padStart(2, '0')}:00 accounts for ${percent(strongestHour.share)} of imported electricity in the selected window.`);
  }

  function addNote(parent, title, detail) {
    const item = document.createElement('div');
    item.className = 'home-history-note';
    const strong = document.createElement('strong');
    strong.textContent = title;
    const span = document.createElement('span');
    span.textContent = detail;
    item.append(strong, span);
    parent.appendChild(item);
  }

  function setText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = String(value ?? '—');
  }

  function format(value, decimals) {
    return Number(value || 0).toLocaleString('en-GB', { maximumFractionDigits: decimals });
  }

  function percent(value) {
    return `${format(Number(value || 0) * 100, 1)}%`;
  }

  function currency(value) {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(value || 0));
  }

  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }
})();
