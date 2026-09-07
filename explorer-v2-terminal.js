(() => {
  const $ = (id) => document.getElementById(id);
  const num = (v,d=0) => Number.isFinite(Number(v)) ? new Intl.NumberFormat('en-GB',{maximumFractionDigits:d}).format(Number(v)) : '—';
  const gbp = (v,d=2) => Number.isFinite(Number(v)) ? new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:d}).format(Number(v)) : '—';
  const set = (id,v) => { const el=$(id); if(el) el.textContent=v; };
  let metrics = {}, indicators = {}, priceHistory = [];

  const miners = {
    s21pro:{name:'Bitmain Antminer S21 Pro',hashrateTh:234,powerW:3510},
    s23hyd:{name:'Bitmain Antminer S23 Hydro',hashrateTh:580,powerW:5510},
    m70s:{name:'MicroBT WhatsMiner M70S',hashrateTh:248,powerW:3348},
    a16xp:{name:'Canaan Avalon A16XP',hashrateTh:300,powerW:3840}
  };

  const devices = [
    {name:'Heat pump',kw:1.8,state:'RUNNING'},
    {name:'Washing machine',kw:1.1,state:'RUNNING',key:'wash'},
    {name:'Fridge / freezer',kw:.12,state:'RUNNING'},
    {name:'Lighting',kw:.18,state:'RUNNING'},
    {name:'Office + TV standby',kw:.24,state:'ON',key:'standby'},
    {name:'EV charger',kw:7.2,state:'OFF',key:'ev'}
  ];

  document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===btn));
    document.querySelectorAll('[data-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.panel===btn.dataset.tab));
  }));

  function metricMap(connectors=[]){
    return Object.fromEntries(connectors.filter(x=>x?.metric?.code).map(x=>[x.metric.code,x.metric]));
  }

  function powerIndex(){
    const parts=[indicators.energyCondition,indicators.gridFlexibility,indicators.lowCarbonCompute].filter(x=>x?.available && Number.isFinite(Number(x.score)));
    if(!parts.length) return null;
    if(parts.length===3) return Math.round(Number(parts[0].score)*.45+Number(parts[1].score)*.35+Number(parts[2].score)*.20);
    return Math.round(parts.reduce((a,x)=>a+Number(x.score),0)/parts.length);
  }
  function labelPower(score){
    if(score==null) return ['—','WAITING'];
    if(score>=81) return ['EXCEPTIONAL','USE FLEXIBLE LOAD'];
    if(score>=61) return ['FAVOURABLE','USE / SCALE FLEXIBLE LOAD'];
    if(score>=41) return ['NORMAL','WATCH CONDITIONS'];
    if(score>=21) return ['EXPENSIVE','WAIT / REDUCE FLEXIBLE LOAD'];
    return ['VERY EXPENSIVE','REDUCE / DEFER'];
  }
  function gridState(mw){ if(!Number.isFinite(mw))return '—'; if(mw>=10000)return 'HIGH SURPLUS'; if(mw>=5000)return 'SURPLUS'; if(mw>=1000)return 'BALANCED'; if(mw>=0)return 'TIGHT'; return 'DEFICIT'; }
  function priceRegime(v){ if(!Number.isFinite(v))return '—'; if(v<50)return 'VERY CHEAP'; if(v<80)return 'CHEAP'; if(v<130)return 'NORMAL'; if(v<180)return 'EXPENSIVE'; return 'EXTREME'; }
  function carbonRegime(v){ if(!Number.isFinite(v))return '—'; if(v<75)return 'VERY LOW'; if(v<125)return 'LOW'; if(v<200)return 'NORMAL'; if(v<300)return 'HIGH'; return 'VERY HIGH'; }
  function stressState(imbalance,margin){ let score=0; if(Number.isFinite(imbalance)){ if(Math.abs(imbalance)>250)score+=2; else if(Math.abs(imbalance)>150)score+=1; } if(Number.isFinite(margin)){ if(margin<5000)score+=2; else if(margin<10000)score+=1; } return score>=3?'HIGH':score>=1?'MODERATE':'LOW'; }

  function renderOverview(){
    const market=Number(metrics.market_index_price?.value), imbalance=Number(metrics.system_imbalance_price?.value), demand=Number(metrics.transmission_system_demand?.value), generation=Number(metrics.generation_mix?.value), surplus=Number(metrics.forecast_surplus?.value), carbon=Number(metrics.carbon_intensity?.value), btc=metrics.bitcoin_network_state;
    const pidx=powerIndex(), [pstate,action]=labelPower(pidx), compute=indicators.computeWindow;
    set('ovPowerIndex',pidx==null?'—':`${pidx}/100`); set('ovPowerState',pstate);
    set('ovComputeWindow',compute?.available?String(compute.state||'—').replaceAll('_',' '):'—'); set('ovComputeScore',compute?.available?`${num(compute.score)}/100`:'—');
    set('ovGridState',gridState(surplus)); set('ovGridValue',Number.isFinite(surplus)?`${surplus>=0?'+':''}${num(surplus/1000,1)} GW`:'—');
    set('ovBtcGbp',btc?.priceGbp?gbp(btc.priceGbp,0):'—'); set('ovBtcHeight',btc?.blockHeight?`Block ${num(btc.blockHeight)}`:'—');
    set('ovMarket',Number.isFinite(market)?`${gbp(market)}/MWh`:'—'); set('ovImbalance',Number.isFinite(imbalance)?`${gbp(imbalance)}/MWh`:'—'); set('ovDemand',Number.isFinite(demand)?`${num(demand)} MW`:'—'); set('ovGeneration',Number.isFinite(generation)?`${num(generation)} MW`:'—'); set('ovSurplus',Number.isFinite(surplus)?`${num(surplus)} MW`:'—'); set('ovCarbon',Number.isFinite(carbon)?`${num(carbon)} gCO₂/kWh`:'—');
    set('nowAction',action);
    set('nowSummary',`COBRA sees ${pstate.toLowerCase()} power conditions with a ${gridState(surplus).toLowerCase()} grid signal and ${carbonRegime(carbon).toLowerCase()} carbon intensity.`);
    const rs=[]; if(Number.isFinite(market))rs.push(['Wholesale price',`${priceRegime(market)} · ${gbp(market)}/MWh`]); if(Number.isFinite(surplus))rs.push(['Grid headroom',`${gridState(surplus)} · ${num(surplus/1000,1)} GW`]); if(Number.isFinite(carbon))rs.push(['Carbon',`${carbonRegime(carbon)} · ${num(carbon)} gCO₂/kWh`]); if(compute?.available)rs.push(['Compute window',`${String(compute.state).replaceAll('_',' ')} · ${num(compute.score)}/100`]);
    const target=$('nowReasons'); if(target)target.innerHTML=rs.map(([a,b])=>`<div><span>${a}</span><strong>${b}</strong></div>`).join('');
    const rank=$('bestUseList'); if(rank){ const good=pidx>=61; const gridGood=surplus>=5000; const mine=indicators.miningEconomics; rank.innerHTML=`<div><span>Flexible compute</span><strong class="${good?'positive':'neutral'}">${good?'FAVOURABLE':'WATCH'}</strong></div><div><span>Battery / EV charging</span><strong class="${gridGood?'positive':'neutral'}">${gridGood?'FAVOURABLE':'WATCH'}</strong></div><div><span>Bitcoin mining</span><strong class="${mine?.score>=70?'positive':mine?.score>=45?'neutral':'negative'}">${mine?.available?String(mine.state).replaceAll('_',' '):'MODEL REQUIRED'}</strong></div><div><span>Deferrable home loads</span><strong class="${good?'positive':'neutral'}">${good?'RUN IF TARIFF ALIGNS':'CHECK TARIFF'}</strong></div>`; }
  }

  function renderPower(){
    const market=Number(metrics.market_index_price?.value), surplus=Number(metrics.forecast_surplus?.value), carbon=Number(metrics.carbon_intensity?.value), imbalance=Number(metrics.system_imbalance_price?.value), margin=Number(metrics.indicated_margin?.value), constraints=Number(metrics.constraint_activity?.value);
    const pidx=powerIndex(), [state]=labelPower(pidx);
    set('powerIndex',pidx==null?'—':`${pidx}/100`); set('powerState',state); set('powerExplanation',`Composite of transparent public energy, grid-flexibility and low-carbon indicators. Current wholesale regime: ${priceRegime(market).toLowerCase()}.`);
    set('powerSurplus',Number.isFinite(surplus)?`${surplus>=0?'+':''}${num(surplus/1000,1)} GW`:'—'); set('powerGridState',gridState(surplus));
    set('priceRegime',priceRegime(market)); set('abundance',surplus>=10000?'VERY HIGH':surplus>=5000?'HIGH':surplus>=1000?'NORMAL':'LOW'); set('stress',stressState(imbalance,margin)); set('flexCondition',indicators.gridFlexibility?.available?String(indicators.gridFlexibility.state).replaceAll('_',' '):'—'); set('carbonRegime',carbonRegime(carbon)); set('constraintPressure',Number.isFinite(constraints)?(constraints>15000000?'HIGH':constraints>5000000?'ELEVATED':'LOW'):'—');
  }

  function miningSim(){
    const btc=metrics.bitcoin_network_state; if(!btc?.priceGbp || !btc?.hashRateGh || !btc?.btcMined24h)return;
    const m=miners[$('minerModel')?.value]||miners.s21pro, units=Math.max(1,Number($('minerUnits')?.value||1)), tariff=Math.max(0,Number($('minerTariff')?.value||0)), pool=Math.max(0,Number($('minerPool')?.value||0)), overhead=Math.max(0,Number($('minerOverhead')?.value||0));
    const share=(m.hashrateTh*1000*units)/Number(btc.hashRateGh), btcDay=share*Number(btc.btcMined24h)*(1-pool/100), revenue=btcDay*Number(btc.priceGbp), machineKwh=m.powerW/1000*24*units, totalKwh=machineKwh*(1+overhead/100), energyCost=totalKwh*(tariff/100), margin=revenue-energyCost, annual=margin*365, breakEven=totalKwh?revenue/totalKwh*100:null, loadMw=(m.powerW*units/1e6)*(1+overhead/100);
    set('mineRevenue',gbp(revenue)); set('mineEnergyCost',gbp(energyCost)); set('mineMargin',`${margin>=0?'+':''}${gbp(margin)}`); set('mineAnnual',`${annual>=0?'+':''}${gbp(annual,0)}`); set('mineBreakEven',`${num(breakEven,2)}p/kWh`); set('mineLoad',loadMw>=1?`${num(loadMw,2)} MW`:`${num(loadMw*1000,1)} kW`); set('mineVerdict',`${m.name} × ${num(units)} is ${margin>=0?'operating-profit positive':'operating-profit negative'} at ${num(tariff,1)}p/kWh under the current BTC/GBP and network state.`);
  }

  function computeSim(){
    const cap=Math.max(.1,Number($('computeCapacity')?.value||20)), util=Math.min(100,Math.max(1,Number($('computeUtil')?.value||85))), pue=Math.max(1,Number($('computePue')?.value||1.18));
    const market=Number(metrics.market_index_price?.value), wholesaleP=Number.isFinite(market)?market/10:null, priceMode=$('computePriceMode')?.value||'wholesale', tariff=priceMode==='wholesale'?wholesaleP:Math.max(0,Number($('computeTariff')?.value||0));
    const itLoad=cap*(util/100), facility=Math.min(cap,itLoad*pue), energyDay=facility*24, costDay=Number.isFinite(tariff)?energyDay*1000*(tariff/100):null, pidx=powerIndex(), [,action]=labelPower(pidx);
    set('computeItLoad',`${num(itLoad,2)} MW`); set('computeFacilityLoad',`${num(facility,2)} MW`); set('computeEnergyDay',`${num(energyDay,1)} MWh`); set('computeCostDay',costDay==null?'—':gbp(costDay,0)); set('computeCostYear',costDay==null?'—':gbp(costDay*365,0)); set('computeCondition',pidx==null?'—':labelPower(pidx)[0]); set('computeAdvice',`${action}. ${priceMode==='wholesale'?'Cost uses current wholesale-equivalent pricing, not a contracted data-centre tariff.':'Cost uses the custom site tariff entered above.'}`);
    const pct=Math.min(100,Math.max(0,Number($('reactorOutputPct')?.value||97))), output=470*(pct/100), energy=output*24, gross=Number.isFinite(market)?energy*market:null, equivalents=facility>0?output/facility:null;
    set('reactorOutput',`${num(output,1)} MW`); set('reactorEnergyDay',`${num(energy,0)} MWh`); set('reactorGrossValue',gross==null?'—':gbp(gross,0)); set('reactorComputeEquivalent',equivalents==null?'—':num(equivalents,1));
  }

  function homeSim(){
    const peak=Math.max(0,Number($('homePeak')?.value||28)), off=Math.max(0,Number($('homeOffpeak')?.value||9)), wash=$('washToggle')?.checked, standby=$('standbyToggle')?.checked, ev=$('evToggle')?.checked;
    const states={wash,standby,ev}; let load=0; devices.forEach(d=>{ let active=d.state!=='OFF'; if(d.key==='wash')active=wash; if(d.key==='standby')active=standby; if(d.key==='ev')active=ev; if(active)load+=d.kw; });
    const list=$('deviceList'); if(list)list.innerHTML=devices.map(d=>{ let active=d.state!=='OFF'; if(d.key)active=states[d.key]; return `<div class="device-row"><strong>${d.name}</strong><span>${active?num(d.kw,2):'0.00'} kW</span><span class="device-state">${active?'ON':'OFF'}</span></div>`; }).join('');
    const reducible=(wash?1.1:0)+(standby?.24:0), reduction=load?reducible/load*100:0, washKwh=1.1, washSaving=Math.max(0,(peak-off)/100*washKwh), standbyKwhDay=.24*8, standbyYear=standbyKwhDay*365*(peak/100), surplus=Number(metrics.forecast_surplus?.value), grid=gridState(surplus);
    set('homeLoad',`${num(load,2)} kW`); set('homeCurrentLoad',`${num(load,2)} kW`); set('homeReducible',`${num(reducible,2)} kW`); set('homeReductionPct',`${num(reduction,1)}%`); set('washSaving',gbp(washSaving)); set('standbySaving',gbp(standbyYear,0)); set('homeGridSignal',grid);
    const shouldShift=off<peak && !(surplus>=5000); set('homeAdviceText',shouldShift?`Shift the washing cycle to the ${num(off,1)}p/kWh off-peak window. Turning off the modelled standby load would reduce current demand by about ${num(standby?.24:0,2)} kW.`:`The grid currently shows ${grid.toLowerCase()} conditions. If your off-peak tariff is available later, COBRA would still compare tariff savings against the present flexibility signal before recommending a shift.`);
  }

  function drawChart(rows){
    priceHistory=rows.map(r=>({value:Number(r.value??r.payload?.value),time:r.observed_at||r.observedAt||r.timestamp||r.time})).filter(r=>Number.isFinite(r.value)); if(priceHistory.length<2){['priceChart','powerPriceChart'].forEach(id=>{const el=$(id);if(el)el.innerHTML='<div class="empty">Price history is still accumulating.</div>';});return;}
    priceHistory.sort((a,b)=>new Date(a.time||0)-new Date(b.time||0)); const vals=priceHistory.map(x=>x.value), min=Math.min(...vals), max=Math.max(...vals), first=vals[0], now=vals.at(-1), move=first?((now-first)/Math.abs(first))*100:0; set('priceMovement',`${move<=0?'↓':'↑'} ${num(Math.abs(move),1)}%`); set('priceLow',`LOW ${gbp(min)}`); set('priceNow',`NOW ${gbp(now)}`); set('priceHigh',`HIGH ${gbp(max)}`);
    const svg=(w,h)=>{const pad=18,range=Math.max(1,max-min),pts=priceHistory.map((p,i)=>`${pad+i/(priceHistory.length-1)*(w-pad*2)},${h-pad-(p.value-min)/range*(h-pad*2)}`).join(' '),poly=`${pad},${h-pad} ${pts} ${w-pad},${h-pad}`;return `<svg viewBox="0 0 ${w} ${h}" aria-label="Wholesale electricity price history"><rect x="0" y="${h*.62}" width="${w}" height="${h*.38}" class="chart-zone-good"/><rect x="0" y="0" width="${w}" height="${h*.28}" class="chart-zone-bad"/><line x1="${pad}" y1="${h/2}" x2="${w-pad}" y2="${h/2}" class="chart-gridline"/><polygon points="${poly}" class="chart-area"/><polyline points="${pts}" class="chart-line"/></svg>`}; const a=$('priceChart'),b=$('powerPriceChart'); if(a)a.innerHTML=svg(800,220); if(b)b.innerHTML=svg(1200,300);
  }

  async function loadHistory(){ try{const r=await fetch('/api/v1/history?metric=market_index_price&region=GB&hours=24&limit=96',{headers:{Accept:'application/json'}}); if(!r.ok)throw 0; const d=await r.json(); drawChart(Array.isArray(d)?d:(d.observations||d.data||d.rows||d.items||[]));}catch{drawChart([]);} }

  async function load(){
    try{
      const r=await fetch('/api/v1/status',{headers:{Accept:'application/json'}}); if(!r.ok)throw 0; const d=await r.json(); metrics=metricMap(d.connectors||[]); indicators=d.indicators?.indicators||{}; set('dataStatus',`${String(d.status||'online').toUpperCase()} · ${num(d.summary?.operational)}/${num(d.summary?.connected)} SOURCES`); set('checkedAt',d.checkedAt?`Updated ${new Date(d.checkedAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}`:'Live'); renderOverview(); renderPower(); miningSim(); computeSim(); homeSim();
    }catch{set('dataStatus','RECONNECTING');set('checkedAt','Live data temporarily unavailable');}
  }

  ['minerModel','minerUnits','minerTariff','minerPool','minerOverhead'].forEach(id=>$(id)?.addEventListener('input',miningSim));
  ['computeCapacity','computeUtil','computePue','computePriceMode','computeTariff','reactorOutputPct'].forEach(id=>$(id)?.addEventListener('input',computeSim));
  ['homePeak','homeOffpeak','washToggle','standbyToggle','evToggle'].forEach(id=>$(id)?.addEventListener('input',homeSim));
  load(); loadHistory(); setInterval(load,60000);
})();