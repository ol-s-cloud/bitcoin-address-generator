const hero=document.querySelector('.hero');
if(hero){
  hero.classList.add('hero-earthrise');
  hero.querySelector('.hero-overlay')?.remove();
  const credit=document.createElement('a');
  credit.className='nasa-credit';
  credit.href='https://science.nasa.gov/resource/apollo-8s-iconic-earthrise/';
  credit.target='_blank';credit.rel='noopener noreferrer';
  credit.textContent='Background: Apollo 8 “Earthrise” · NASA / Bill Anders';
  hero.appendChild(credit);
}

for(const href of ['ui-patch.css','fluid.css']){const style=document.createElement('link');style.rel='stylesheet';style.href=href;document.head.appendChild(style);}

const toolLayout=document.querySelector('.tool-layout');
if(toolLayout){
  const news=document.createElement('section');
  news.className='news-pulse';
  news.id='news';
  news.innerHTML=`<div class="news-head"><div><div class="eyebrow">GLOBAL CRYPTO PULSE</div><h2>Bitcoin, blockchain & cryptography — now.</h2><p>Headlines are pulled from independent news providers and link directly to the original publisher.</p></div><div class="news-status"><span class="live-dot"></span><span id="newsUpdated">Loading live feed…</span></div></div><div id="newsGrid" class="news-grid"><div class="news-loading">Fetching latest headlines…</div></div><div class="news-foot">COBRA does not edit or endorse third-party headlines. Sources remain responsible for their reporting.</div>`;
  toolLayout.insertAdjacentElement('afterend',news);
  loadNews();
}

async function loadNews(){
  const grid=document.getElementById('newsGrid');
  const updated=document.getElementById('newsUpdated');
  try{
    const response=await fetch('/api/news',{headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error('News unavailable');
    const data=await response.json();
    if(!data.items?.length)throw new Error('No headlines');
    grid.innerHTML=data.items.slice(0,8).map(item=>`<a class="news-card" href="${escapeAttr(item.link)}" target="_blank" rel="noopener noreferrer"><div class="news-meta"><span>${escapeHtml(item.source)}</span><time>${relative(item.published)}</time></div><h3>${escapeHtml(item.title)}</h3><span class="news-open">Read original ↗</span></a>`).join('');
    updated.textContent=`Updated ${relative(data.updatedAt)}`;
  }catch(error){
    grid.innerHTML=`<div class="news-loading">Live headlines are temporarily unavailable. <a href="https://www.coindesk.com/latest-crypto-news" target="_blank" rel="noopener noreferrer">Open CoinDesk ↗</a></div>`;
    updated.textContent='Feed temporarily unavailable';
  }
}
function escapeHtml(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function escapeAttr(v=''){return escapeHtml(v)}
function relative(value){const t=new Date(value).getTime();if(!Number.isFinite(t))return'latest';const s=Math.max(0,Math.floor((Date.now()-t)/1000));if(s<60)return`${Math.max(1,s)}s ago`;const m=Math.floor(s/60);if(m<60)return`${m}m ago`;const h=Math.floor(m/60);if(h<24)return`${h}h ago`;return`${Math.floor(h/24)}d ago`}

const footer=document.querySelector('footer');
if(footer){footer.innerHTML=`<span>First rollout 2023 · Last updated 2026</span><span><a href="https://github.com/ol-s-cloud/bitcoin-address-generator" target="_blank" rel="noopener noreferrer">COBRA by ol-s-cloud ↗</a></span>`;}
