(() => {
  const $ = (id) => document.getElementById(id);
  const num = (v,d=0) => Number.isFinite(Number(v)) ? new Intl.NumberFormat('en-GB',{maximumFractionDigits:d}).format(Number(v)) : '—';
  const gbp = (v,d=0) => Number.isFinite(Number(v)) ? new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:d}).format(Number(v)) : '—';
  const set = (id,v) => { const el=$(id); if(el) el.textContent=v; };
  let metrics = {};

  const inject = () => {
    const computePanel = document.querySelector('[data-panel="compute"] .compute-grid');
    if (computePanel && !$('computeDecisionCard')) {
      const node = document.createElement('article');
      node.className = 'panel wide';
      node.id = 'computeDecisionCard';
      node.innerHTML = `
        <div class="eyebrow">COBRA AI / DATA CENTRE DECISION</div>
        <div class="application-decision-grid">
          <div><span>ACTION</span><strong id="computeAction">WAITING</strong></div>
          <div><span>ECONOMIC CONDITION</span><strong id="computeEconomicCondition">—</strong></div>
          <div><span>BREAK-EVEN POWER</span><strong id="computeBreakEven">—</strong></div>
          <div><span>NET CONTRIBUTION / DAY</span><strong id="computeNet">—</strong></div>
          <div><span>POWER HEADROOM</span><strong id="computeHeadroom">—</strong></div>
          <div><span>GRID CONTEXT</span><strong id="computeGridContext">—</strong></div>
        </div>
        <div class="application-assumptions">
          <label>Workload gross value (£ / IT MWh)<input id="computeWorkloadValue" type="number" min="0" step="1" value="250"/></label>
          <small>User-supplied scenario assumption. COBRA does not claim a universal AI-inference revenue rate.</small>
        </div>
        <div class="verdict" id="computeDecisionWhy">Enter facility assumptions to calculate the decision.</div>`;
      computePanel.appendChild(node);
    }

    const generation = document.querySelector('[data-panel="compute"] .generation-card');
    if (generation && !$('generationDecision')) {
      const box = document.createElement('div');
      box.id = 'generationDecision';
      box.className = 'generation-decision';
      box.innerHTML = `
        <div class="eyebrow">COBRA GENERATION DECISION</div>
        <div class="application-decision-grid">
          <div><span>ACTION</span><strong id="generationAction">WAITING</strong></div>
          <div><span>GRID SALE VALUE / DAY</span><strong id="generationGridValue">—</strong></div>
          <div><span>COMPUTE ALLOCATION VALUE / DAY</span><strong id="generationComputeValue">—</strong></div>
          <div><span>REFERENCE COST / DAY</span><strong id="generationCost">—</strong></div>
          <div><span>GRID NET / DAY</span><strong id="generationGridNet">—</strong></div>
          <div><span>COMPUTE NET / DAY</span><strong id="generationComputeNet">—</strong></div>
        </div>
        <div class="application-assumptions">
          <label>Generation operating cost (£ / MWh)<input id="generationOperatingCost" type="number" min="0" step="1" value="50"/></label>
          <label>Compute allocation (%)<input id="generationComputeShare" type="number" min="0" max="100" step="1" value="20"/></label>
          <small>Reference scenario only. The operating-cost and compute-allocation assumptions are editable and are not claims about any named nuclear project.</small>
        </div>
        <div class="verdict" id="generationWhy">COBRA will compare market sale versus serving the modelled compute load.</div>`;
      generation.appendChild(box);
    }

    const homePanel = document.querySelector('[data-panel="home"] .home-grid');
    if (homePanel && !$('batteryDecisionCard')) {
      const card = document.createElement('article');
      card.className='panel wide';
      card.id='batteryDecisionCard';
      card.innerHTML=`
        <div class="eyebrow">BATTERY / EV FLEXIBILITY · REFERENCE SCENARIO</div>
        <h2>Store, wait or discharge</h2>
        <div class="application-assumptions battery-inputs">
          <label>Battery capacity (kWh)<input id="batteryCapacity" type="number" min="1" step="1" value="10"/></label>
          <label>State of charge (%)<input id="batterySoc" type="number" min="0" max="100" step="1" value="40"/></label>
          <label>Charge tariff (p/kWh)<input id="batteryChargeTariff" type="number" min="0" step="0.1" value="9"/></label>
          <label>Export / avoided-cost value (p/kWh)<input id="batteryExportValue" type="number" min="0" step="0.1" value="28"/></label>
          <label>Round-trip efficiency (%)<input id="batteryEfficiency" type="number" min="50" max="100" step="1" value="90"/></label>
        </div>
        <div class="application-decision-grid">
          <div><span>ACTION</span><strong id="batteryAction">WAITING</strong></div>
          <div><span>AVAILABLE TO CHARGE</span><strong id="batteryChargeRoom">—</strong></div>
          <div><span>USABLE STORED ENERGY</span><strong id="batteryUsableEnergy">—</strong></div>
          <div><span>VALUE SPREAD</span><strong id="batterySpread">—</strong></div>
          <div><span>FULL-CYCLE GROSS VALUE</span><strong id="batteryCycleValue">—</strong></div>
          <div><span>GRID CONTEXT</span><strong id="batteryGridContext">—</strong></div>
        </div>
        <div class="verdict" id="batteryWhy">Reference battery economics use the tariffs entered above and live grid context.</div>
        <p class="disclaimer">Excludes battery degradation, export limits, standing charges, network fees, taxes and hardware cost.</p>`;
      homePanel.appendChild(card);
    }

    document.querySelectorAll('#computeWorkloadValue,#generationOperatingCost,#generationComputeShare,#batteryCapacity,#batterySoc,#batteryChargeTariff,#batteryExportValue,#batteryEfficiency,#computeCapacity,#computeUtil,#computePue,#computePriceMode,#computeTariff,#reactorOutputPct').forEach(el=>el?.addEventListener('input',render));
  };

  const metricMap = (connectors=[]) => Object.fromEntries(connectors.filter(x=>x?.metric?.code).map(x=>[x.metric.code,x.metric]));
  const gridState = (mw) => !Number.isFinite(mw)?'UNKNOWN':mw>=10000?'HIGH SURPLUS':mw>=5000?'SURPLUS':mw>=1000?'BALANCED':mw>=0?'TIGHT':'DEFICIT';

  function renderCompute(){
    if (!$('computeAction')) return;
    const cap=Math.max(.1,Number($('computeCapacity')?.value||20));
    const util=Math.min(100,Math.max(1,Number($('computeUtil')?.value||85)));
    const pue=Math.max(1,Number($('computePue')?.value||1.18));
    const market=Number(metrics.market_index_price?.value);
    const mode=$('computePriceMode')?.value||'wholesale';
    const tariff=mode==='wholesale' && Number.isFinite(market) ? market/10 : Math.max(0,Number($('computeTariff')?.value||0));
    const workloadValue=Math.max(0,Number($('computeWorkloadValue')?.value||0));
    const itLoad=cap*(util/100);
    const facilityLoad=Math.min(cap,itLoad*pue);
    const itMwhDay=itLoad*24;
    const facilityMwhDay=facilityLoad*24;
    const gross=itMwhDay*workloadValue;
    const powerCost=Number.isFinite(tariff)?facilityMwhDay*1000*(tariff/100):null;
    const net=powerCost==null?null:gross-powerCost;
    const breakEven=facilityMwhDay>0 ? (gross/(facilityMwhDay*1000))*100 : null;
    const headroom=Number.isFinite(tariff)&&Number.isFinite(breakEven)?breakEven-tariff:null;
    const ratio=Number.isFinite(breakEven)&&breakEven>0?tariff/breakEven:null;
    const surplus=Number(metrics.forecast_surplus?.value);
    let action='WAIT', condition='UNRESOLVED';
    if (Number.isFinite(net)) {
      if (net>0 && ratio<=.75) { action='RUN / SCALE'; condition='STRONG'; }
      else if (net>0 && ratio<=.9) { action='RUN'; condition='FAVOURABLE'; }
      else if (net>0) { action='RUN WITH CAUTION'; condition='MARGINAL'; }
      else if (surplus>=5000) { action='SHIFT / NEGOTIATE POWER'; condition='UNFAVOURABLE'; }
      else { action='CURTAIL / WAIT'; condition='UNFAVOURABLE'; }
    }
    set('computeAction',action); set('computeEconomicCondition',condition); set('computeBreakEven',Number.isFinite(breakEven)?`${num(breakEven,2)}p/kWh`:'—');
    set('computeNet',net==null?'—':`${net>=0?'+':''}${gbp(net)}`); set('computeHeadroom',headroom==null?'—':`${headroom>=0?'+':''}${num(headroom,2)}p/kWh`); set('computeGridContext',gridState(surplus));
    set('computeDecisionWhy',Number.isFinite(net)?`${condition}. Modelled workload gross value is ${gbp(gross)}/day against ${gbp(powerCost)}/day of electricity. Site power is ${headroom>=0?`${num(Math.abs(headroom),2)}p/kWh below`:`${num(Math.abs(headroom),2)}p/kWh above`} the modelled break-even threshold. ${gridState(surplus)} grid context is secondary to the site's own economics.`:'Enter a valid workload value and tariff to calculate economics.');
  }

  function renderGeneration(){
    if (!$('generationAction')) return;
    const market=Number(metrics.market_index_price?.value);
    const pct=Math.min(100,Math.max(0,Number($('reactorOutputPct')?.value||97)));
    const outputMw=470*pct/100;
    const energyMwhDay=outputMw*24;
    const opCostMwh=Math.max(0,Number($('generationOperatingCost')?.value||0));
    const computeShare=Math.min(100,Math.max(0,Number($('generationComputeShare')?.value||0)))/100;
    const computeValueMwh=Math.max(0,Number($('computeWorkloadValue')?.value||0));
    const computeMwh=Math.min(energyMwhDay, energyMwhDay*computeShare);
    const gridMwh=energyMwhDay-computeMwh;
    const gridGross=Number.isFinite(market)?energyMwhDay*market:null;
    const mixedGross=Number.isFinite(market)?gridMwh*market+computeMwh*computeValueMwh:null;
    const operatingCost=energyMwhDay*opCostMwh;
    const gridNet=gridGross==null?null:gridGross-operatingCost;
    const computeNet=mixedGross==null?null:mixedGross-operatingCost;
    let action='WAITING';
    if (Number.isFinite(gridNet)&&Number.isFinite(computeNet)) action=computeNet>gridNet?'SERVE COMPUTE + SELL BALANCE':'SELL TO GRID';
    set('generationAction',action); set('generationGridValue',gridGross==null?'—':gbp(gridGross)); set('generationComputeValue',mixedGross==null?'—':gbp(mixedGross)); set('generationCost',gbp(operatingCost)); set('generationGridNet',gridNet==null?'—':gbp(gridNet)); set('generationComputeNet',computeNet==null?'—':gbp(computeNet));
    const delta=Number.isFinite(gridNet)&&Number.isFinite(computeNet)?computeNet-gridNet:null;
    set('generationWhy',delta==null?'Waiting for live wholesale pricing.':`${action}. Under the entered assumptions, allocating ${num(computeShare*100)}% of output to compute changes daily gross operating contribution by ${delta>=0?'+':''}${gbp(delta)} versus selling all output at the current wholesale price. This is a reference economic comparison, not a forecast of a specific plant.`);
  }

  function renderBattery(){
    if (!$('batteryAction')) return;
    const capacity=Math.max(1,Number($('batteryCapacity')?.value||10));
    const soc=Math.min(100,Math.max(0,Number($('batterySoc')?.value||40)))/100;
    const charge=Math.max(0,Number($('batteryChargeTariff')?.value||0));
    const exportValue=Math.max(0,Number($('batteryExportValue')?.value||0));
    const eff=Math.min(1,Math.max(.5,Number($('batteryEfficiency')?.value||90)/100));
    const room=capacity*(1-soc);
    const stored=capacity*soc*eff;
    const spread=exportValue*eff-charge;
    const cycleValue=room*Math.max(0,spread)/100;
    const surplus=Number(metrics.forecast_surplus?.value);
    let action='WAIT';
    if (spread>0 && surplus>=5000 && room>0.5) action='CHARGE';
    else if (spread>0 && soc>=.5 && surplus<1000) action='DISCHARGE / EXPORT';
    else if (spread>0 && room>0.5) action='CHARGE IF TARIFF WINDOW OPEN';
    else action='WAIT';
    set('batteryAction',action); set('batteryChargeRoom',`${num(room,1)} kWh`); set('batteryUsableEnergy',`${num(stored,1)} kWh`); set('batterySpread',`${spread>=0?'+':''}${num(spread,1)}p/kWh`); set('batteryCycleValue',gbp(cycleValue,2)); set('batteryGridContext',gridState(surplus));
    set('batteryWhy',`${action}. After ${num(eff*100)}% round-trip efficiency, the entered value spread is ${spread>=0?'+':''}${num(spread,1)}p/kWh. Live GB grid context is ${gridState(surplus).toLowerCase()}; tariff economics remain the primary decision input.`);
  }

  function render(){ renderCompute(); renderGeneration(); renderBattery(); }

  async function load(){
    inject();
    try {
      const response=await fetch('/api/v1/status',{cache:'no-store'});
      if(response.ok){ const data=await response.json(); metrics=metricMap(data.connectors||data.data?.connectors||[]); }
    } catch {}
    render();
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',load); else load();
  setInterval(async()=>{ try{const r=await fetch('/api/v1/status',{cache:'no-store'});if(r.ok){const d=await r.json();metrics=metricMap(d.connectors||d.data?.connectors||[]);render();}}catch{} },60000);
})();
