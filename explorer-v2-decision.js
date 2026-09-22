(() => {
  const context = document.querySelector('.terminal-context');
  if (!context || document.getElementById('cobraDecisionSurface')) return;

  const style = document.createElement('style');
  style.textContent = `
    .cobra-decision-surface{margin:8px 0 26px;border:1px solid var(--line);border-radius:20px;background:var(--panel);overflow:hidden}
    .cobra-decision-inputs{display:grid;grid-template-columns:1.4fr 1fr 1.6fr .7fr auto;gap:10px;padding:18px;border-bottom:1px solid var(--line)}
    .cobra-decision-inputs label{display:grid;gap:7px;color:var(--muted);font:800 8px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase}
    .cobra-decision-inputs input,.cobra-decision-inputs select{min-height:44px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--text);padding:0 11px}
    .cobra-decision-inputs button{align-self:end;min-height:44px;border:1px solid var(--text);border-radius:10px;background:var(--text);color:var(--bg);padding:0 18px;font-weight:900;cursor:pointer}
    .cobra-decision-body{display:grid;grid-template-columns:.8fr 1.2fr;gap:0}
    .cobra-primary-verdict{padding:26px;border-right:1px solid var(--line)}
    .cobra-primary-verdict>span,.cobra-decision-metrics span,.cobra-confidence span{display:block;color:var(--muted);font:800 8px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.09em;text-transform:uppercase}
    .cobra-primary-verdict h2{margin:12px 0 2px;font-size:clamp(42px,5vw,72px);letter-spacing:-.06em}
    .cobra-primary-verdict h3{margin:0;color:var(--accent);font-size:20px;letter-spacing:.06em}
    .cobra-primary-verdict p{margin:16px 0 0;color:var(--muted);line-height:1.7}
    .cobra-decision-evidence{padding:26px}.cobra-decision-metrics{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line)}
    .cobra-decision-metrics>div{padding:14px 10px;border-bottom:1px solid var(--line)}.cobra-decision-metrics strong{display:block;margin-top:7px;font-size:18px}
    .cobra-confidence{display:flex;justify-content:space-between;gap:14px;align-items:flex-end;margin-top:18px}.cobra-confidence strong{font-size:24px}
    .cobra-driver-list{display:grid;gap:7px;margin-top:16px}.cobra-driver-list div{padding:10px 0;border-top:1px solid var(--line);font-size:11px;line-height:1.55}.cobra-driver-list .risk{color:var(--muted)}
    .cobra-decision-foot{padding:12px 18px;border-top:1px solid var(--line);color:var(--muted);font-size:9px;line-height:1.6}
    @media(max-width:980px){.cobra-decision-inputs{grid-template-columns:repeat(2,1fr)}.cobra-decision-inputs button{grid-column:1/-1}.cobra-decision-body{grid-template-columns:1fr}.cobra-primary-verdict{border-right:0;border-bottom:1px solid var(--line)}}
    @media(max-width:620px){.cobra-decision-inputs,.cobra-decision-metrics{grid-template-columns:1fr}.cobra-primary-verdict,.cobra-decision-evidence{padding:18px}}
  `;
  document.head.appendChild(style);

  const section = document.createElement('section');
  section.id = 'cobraDecisionSurface';
  section.className = 'cobra-decision-surface';
  section.innerHTML = `
    <div class="cobra-decision-inputs">
      <label>Site<input id="decisionSite" value="Glasgow Test Site" /></label>
      <label>Site tariff (p/kWh)<input id="decisionTariff" type="number" min="0" step="0.1" value="7" /></label>
      <label>Miner<select id="decisionMiner"><option value="bitmain-antminer-s21-pro-234t">Bitmain Antminer S21 Pro · 234 TH/s</option><option value="bitmain-antminer-s21-200t">Bitmain Antminer S21 · 200 TH/s</option><option value="bitmain-antminer-s21-xp-270t">Bitmain Antminer S21 XP · 270 TH/s</option><option value="bitmain-antminer-s21-xp-hyd-473t">Bitmain Antminer S21 XP Hydro · 473 TH/s</option></select></label>
      <label>Units<input id="decisionUnits" type="number" min="1" value="1" /></label>
      <button id="decisionRun" type="button">Run COBRA →</button>
    </div>
    <div class="cobra-decision-body">
      <div class="cobra-primary-verdict"><span>COBRA CONDITION · SITE ECONOMICS</span><h2 id="decisionAction">CALCULATING</h2><h3 id="decisionCondition">LIVE DATA</h3><p id="decisionSummary">Combining your site tariff with current Bitcoin and GB electricity conditions.</p></div>
      <div class="cobra-decision-evidence">
        <div class="cobra-decision-metrics">
          <div><span>Site electricity</span><strong id="decisionSiteTariff">—</strong></div>
          <div><span>Break-even electricity</span><strong id="decisionBreakEven">—</strong></div>
          <div><span>Margin headroom</span><strong id="decisionHeadroom">—</strong></div>
          <div><span>Net contribution / day</span><strong id="decisionNetDay">—</strong></div>
          <div><span>Net contribution / year</span><strong id="decisionNetYear">—</strong></div>
          <div><span>Grid headroom</span><strong id="decisionGrid">—</strong></div>
        </div>
        <div class="cobra-confidence"><div><span>Data confidence</span><strong id="decisionConfidence">—</strong></div><small id="decisionCheckedAt">—</small></div>
        <div class="cobra-driver-list" id="decisionDrivers"></div>
      </div>
    </div>
    <div class="cobra-decision-foot">The decision uses the entered site tariff for profitability. GB wholesale price is context only. Data confidence describes source availability/freshness, not probability of future profit. Power, Mining, Compute and Home tabs below remain scenario/evidence modules.</div>`;
  context.insertAdjacentElement('afterend', section);

  const $ = (id) => document.getElementById(id);
  const gbp = (v,d=2) => Number.isFinite(Number(v)) ? new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:d}).format(Number(v)) : '—';
  const num = (v,d=1) => Number.isFinite(Number(v)) ? new Intl.NumberFormat('en-GB',{maximumFractionDigits:d}).format(Number(v)) : '—';

  async function runDecision(){
    $('decisionRun').disabled = true;
    $('decisionRun').textContent = 'Calculating…';
    const params = new URLSearchParams({
      country:'GB',
      siteName:$('decisionSite').value || 'UK Test Site',
      tariffPenceKwh:$('decisionTariff').value || '7',
      assetId:$('decisionMiner').value,
      units:$('decisionUnits').value || '1',
      poolFeePct:'2',
      facilityEnergyOverheadPct:'7'
    });
    try{
      const response = await fetch(`/api/v1/intelligence?${params.toString()}`,{headers:{Accept:'application/json'}});
      const data = await response.json();
      if(!response.ok) throw new Error(data.error || 'intelligence_unavailable');
      const d=data.decision,e=data.economics;
      $('decisionAction').textContent=String(d.action||'—').replaceAll('_',' ');
      $('decisionCondition').textContent=d.condition||'—';
      $('decisionSiteTariff').textContent=`${num(d.economics.siteTariffPenceKwh,2)}p/kWh`;
      $('decisionBreakEven').textContent=`${num(e.breakEvenPenceKwh,2)}p/kWh`;
      $('decisionHeadroom').textContent=`${d.economics.headroomPenceKwh>=0?'+':''}${num(d.economics.headroomPenceKwh,2)}p · ${num(d.economics.headroomPct,1)}%`;
      $('decisionNetDay').textContent=`${e.netContributionGbpDay>=0?'+':''}${gbp(e.netContributionGbpDay)}`;
      $('decisionNetYear').textContent=`${e.netContributionGbpYear>=0?'+':''}${gbp(e.netContributionGbpYear,0)}`;
      $('decisionGrid').textContent=Number.isFinite(Number(data.market.forecastSurplusMw))?`${num(data.market.forecastSurplusMw/1000,1)} GW`:'—';
      $('decisionConfidence').textContent=`${num(d.dataConfidence.score,0)}/100`;
      $('decisionCheckedAt').textContent=new Date(data.checkedAt).toLocaleString('en-GB');
      $('decisionSummary').textContent=d.drivers?.[0]?.text || `${data.asset.model} economics calculated against the current network state.`;
      const rows=[...(d.drivers||[]).map(x=>`<div>${escapeHtml(x.text)}</div>`),...(d.risks||[]).map(x=>`<div class="risk">RISK · ${escapeHtml(x)}</div>`)];
      $('decisionDrivers').innerHTML=rows.join('');
    }catch(error){
      $('decisionAction').textContent='UNAVAILABLE'; $('decisionCondition').textContent='CHECK DATA'; $('decisionSummary').textContent=String(error.message||error);
    }finally{
      $('decisionRun').disabled=false; $('decisionRun').textContent='Run COBRA →';
    }
  }

  function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  $('decisionRun').addEventListener('click',runDecision);
  ['decisionTariff','decisionUnits','decisionMiner'].forEach(id=>$(id).addEventListener('change',runDecision));
  runDecision();
})();
