(() => {
  const grid = document.querySelector('[data-panel="home"] .home-grid');
  if (!grid || document.getElementById('smartMeterImportPanel')) return;

  const panel = document.createElement('article');
  panel.id = 'smartMeterImportPanel';
  panel.className = 'panel result-card home-advice';
  panel.innerHTML = `
    <div class="eyebrow">HOME ENERGY DIGITAL TWIN · CSV IMPORT</div>
    <h2>Analyse real half-hourly smart-meter history</h2>
    <p class="disclaimer" style="margin-top:0">Preview parser runs in your browser. The selected CSV is not uploaded by this module. It expects a timestamp/date column and a consumption column in kWh; common supplier-export headings are detected automatically.</p>
    <div class="home-import-controls" style="display:grid;grid-template-columns:minmax(0,1fr) 170px;gap:12px;align-items:end;margin:18px 0">
      <label style="display:grid;gap:7px;color:var(--muted);font:800 9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase">Smart-meter CSV<input id="smartMeterCsv" type="file" accept=".csv,text/csv" style="min-height:46px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--text);padding:10px"/></label>
      <label style="display:grid;gap:7px;color:var(--muted);font:800 9px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase">Shiftable share (%)<input id="smartMeterShiftable" type="number" min="0" max="80" step="1" value="20" style="min-height:46px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--text);padding:0 12px"/></label>
    </div>
    <div class="result-grid">
      <div><span>Coverage</span><strong id="smCoverage">—</strong></div>
      <div><span>Consumption</span><strong id="smTotal">—</strong></div>
      <div><span>Average / day</span><strong id="smDaily">—</strong></div>
      <div><span>Peak load</span><strong id="smPeak">—</strong></div>
      <div><span>Baseload estimate</span><strong id="smBase">—</strong></div>
      <div><span>Overnight share</span><strong id="smNight">—</strong></div>
      <div><span>Flat-tariff cost</span><strong id="smFlatCost">—</strong></div>
      <div><span>Actual TOU cost</span><strong id="smTouCost">—</strong></div>
      <div><span>Optimised TOU cost</span><strong id="smOptimisedCost">—</strong></div>
    </div>
    <div class="verdict" id="smVerdict">Choose a supplier smart-meter CSV to create a local historical household energy model.</div>
    <div id="smError" class="disclaimer"></div>
  `;
  grid.appendChild(panel);

  const fileInput = document.getElementById('smartMeterCsv');
  const shiftInput = document.getElementById('smartMeterShiftable');
  let lastRows = null;

  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      lastRows = parseSmartMeterCsv(text);
      render(lastRows);
    } catch (error) {
      setText('smError', `Could not analyse CSV: ${String(error?.message || 'invalid_file')}`);
      setText('smVerdict', 'CSV import needs a timestamp/date column and numeric electricity consumption in kWh.');
    }
  });
  shiftInput?.addEventListener('input', () => lastRows && render(lastRows));
  document.getElementById('homePeak')?.addEventListener('input', () => lastRows && render(lastRows));
  document.getElementById('homeOffpeak')?.addEventListener('input', () => lastRows && render(lastRows));

  function render(rows) {
    setText('smError', '');
    if (!rows.length) throw new Error('no_valid_meter_rows');
    const sorted = [...rows].sort((a,b) => a.time - b.time);
    const total = sum(sorted.map(r => r.kwh));
    const first = sorted[0].time;
    const last = sorted[sorted.length - 1].time;
    const intervalHours = inferIntervalHours(sorted);
    const days = Math.max(1, (last - first) / 86400000 + intervalHours / 24);
    const loadsKw = sorted.map(r => r.kwh / intervalHours).filter(Number.isFinite).sort((a,b) => a-b);
    const peakKw = loadsKw.at(-1) || 0;
    const baseloadKw = percentile(loadsKw, 0.1);
    const overnight = sum(sorted.filter(r => isOffPeak(r.time)).map(r => r.kwh));
    const peakTariff = Math.max(0, Number(document.getElementById('homePeak')?.value || 28));
    const offTariff = Math.max(0, Number(document.getElementById('homeOffpeak')?.value || 9));
    const shiftableShare = Math.min(80, Math.max(0, Number(shiftInput?.value || 20))) / 100;
    const offKwh = overnight;
    const peakKwh = total - offKwh;
    const flatCost = total * peakTariff / 100;
    const touCost = (offKwh * offTariff + peakKwh * peakTariff) / 100;
    const shiftableKwh = peakKwh * shiftableShare;
    const optimisedCost = ((offKwh + shiftableKwh) * offTariff + (peakKwh - shiftableKwh) * peakTariff) / 100;
    const saving = touCost - optimisedCost;

    setText('smCoverage', `${format(days, 1)} days · ${sorted.length} reads`);
    setText('smTotal', `${format(total, 1)} kWh`);
    setText('smDaily', `${format(total / days, 1)} kWh`);
    setText('smPeak', `${format(peakKw, 2)} kW`);
    setText('smBase', `${format(baseloadKw, 2)} kW`);
    setText('smNight', `${format(total ? overnight / total * 100 : 0, 1)}%`);
    setText('smFlatCost', money(flatCost));
    setText('smTouCost', money(touCost));
    setText('smOptimisedCost', money(optimisedCost));
    setText('smVerdict', saving > 0
      ? `COBRA estimates that shifting ${format(shiftableKwh,1)} kWh of the imported period from peak to the modelled off-peak window could reduce energy charges by about ${money(saving)} for this dataset. This is a tariff simulation, not a supplier quote.`
      : 'The current tariff assumptions do not create a positive load-shifting saving for this imported profile.');
  }

  function parseSmartMeterCsv(text) {
    const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) throw new Error('csv_has_no_data');
    const delimiter = detectDelimiter(lines[0]);
    const headers = splitCsvLine(lines[0], delimiter).map(normalizeHeader);
    const dateIndex = findIndex(headers, ['datetime','date_time','timestamp','interval_start','start','date','time']);
    const consumptionIndex = findIndex(headers, ['consumption_kwh','consumption','usage_kwh','usage','energy_kwh','kwh','electricity']);
    if (dateIndex < 0 || consumptionIndex < 0) throw new Error('required_columns_not_detected');
    const rows = [];
    for (const line of lines.slice(1)) {
      const cells = splitCsvLine(line, delimiter);
      const time = parseDate(cells[dateIndex]);
      const kwh = Number(String(cells[consumptionIndex] ?? '').replace(/,/g,'').trim());
      if (time && Number.isFinite(kwh) && kwh >= 0) rows.push({ time, kwh });
    }
    if (rows.length < 2) throw new Error('not_enough_valid_rows');
    return rows;
  }

  function detectDelimiter(header) {
    const candidates = [',',';','\t'];
    return candidates.sort((a,b) => header.split(b).length - header.split(a).length)[0];
  }
  function splitCsvLine(line, delimiter) {
    const out=[]; let current=''; let quoted=false;
    for (let i=0;i<line.length;i++) {
      const ch=line[i];
      if (ch==='"') {
        if (quoted && line[i+1]==='"') { current+='"'; i++; }
        else quoted=!quoted;
      } else if (ch===delimiter && !quoted) { out.push(current.trim()); current=''; }
      else current+=ch;
    }
    out.push(current.trim()); return out;
  }
  function normalizeHeader(value) { return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''); }
  function findIndex(headers, aliases) {
    for (const alias of aliases) { const exact=headers.indexOf(alias); if (exact>=0) return exact; }
    return headers.findIndex(h => aliases.some(alias => h.includes(alias)));
  }
  function parseDate(value) {
    const raw=String(value || '').trim();
    if (!raw) return null;
    let parsed=new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
    const uk=raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (uk) {
      parsed=new Date(Number(uk[3]),Number(uk[2])-1,Number(uk[1]),Number(uk[4]||0),Number(uk[5]||0),Number(uk[6]||0));
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }
  function inferIntervalHours(rows) {
    const deltas=[];
    for (let i=1;i<Math.min(rows.length,200);i++) {
      const hours=(rows[i].time-rows[i-1].time)/3600000;
      if (hours>0 && hours<=4) deltas.push(hours);
    }
    if (!deltas.length) return 0.5;
    deltas.sort((a,b)=>a-b); return deltas[Math.floor(deltas.length/2)] || 0.5;
  }
  function isOffPeak(date) {
    const minutes=date.getHours()*60+date.getMinutes();
    return minutes>=30 && minutes<270; // 00:30–04:30 reference window
  }
  function percentile(values,p) { if (!values.length) return 0; return values[Math.min(values.length-1,Math.max(0,Math.floor((values.length-1)*p)))] || 0; }
  function sum(values) { return values.reduce((a,b)=>a+(Number(b)||0),0); }
  function format(value,digits=1) { return new Intl.NumberFormat('en-GB',{maximumFractionDigits:digits}).format(Number(value)||0); }
  function money(value) { return new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:2}).format(Number(value)||0); }
  function setText(id,value) { const el=document.getElementById(id); if (el) el.textContent=value; }
})();
