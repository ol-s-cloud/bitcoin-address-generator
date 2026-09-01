import './poll.js';
const hero=document.querySelector('.hero');
if(hero){
  hero.classList.add('hero-black-marble');
  hero.querySelector('.hero-overlay')?.remove();
  hero.style.backgroundImage='none';
  hero.style.position='relative';
  hero.style.overflow='hidden';
  const bg=document.createElement('img');
  bg.className='hero-bg-image';
  bg.src='https://svs.gsfc.nasa.gov/vis/a010000/a011100/a011146/cover_earth_night_rotate_lrg.jpg';
  bg.alt='';
  bg.setAttribute('aria-hidden','true');
  Object.assign(bg.style,{position:'absolute',inset:'0',width:'100%',height:'100%',objectFit:'cover',objectPosition:'center center',zIndex:'-3',display:'block',opacity:'1'});
  hero.prepend(bg);
  const shade=document.createElement('div');
  shade.className='hero-bg-shade';
  Object.assign(shade.style,{position:'absolute',inset:'0',zIndex:'-2',background:'linear-gradient(90deg,rgba(5,7,6,.95) 0%,rgba(5,7,6,.78) 39%,rgba(5,7,6,.26) 72%,rgba(5,7,6,.45) 100%),linear-gradient(180deg,rgba(5,7,6,.05) 50%,#050706 100%)',pointerEvents:'none'});
  hero.insertBefore(shade,hero.children[1]||null);
  const content=hero.querySelector('.hero-content');
  if(content){content.style.position='relative';content.style.zIndex='1';}
  const credit=document.createElement('a');
  credit.className='nasa-credit';
  credit.href='https://svs.gsfc.nasa.gov/11146/';
  credit.target='_blank';credit.rel='noopener noreferrer';
  credit.textContent='Earth at Night / Black Marble · NASA Earth Observatory + NASA GSFC';
  hero.appendChild(credit);
}

for(const href of ['ui-patch.css','fluid.css']){const style=document.createElement('link');style.rel='stylesheet';style.href=href;document.head.appendChild(style);}

const desert=document.querySelector('.desert-callout');
if(desert){
  const trust=document.createElement('section');
  trust.className='trust-manifesto';
  trust.innerHTML=`<div class="eyebrow">LOCAL-FIRST CRYPTOGRAPHY</div><h2>No KYC. No account. No custodian. No central key issuer.</h2><p>Bitcoin does not need COBRA to assign you an account. Bring your own valid secret number to explore the mathematics, or use COBRA’s cryptographically secure generator. The corresponding address is derived from the key material itself.</p><div class="trust-points"><span>NO KYC</span><span>NO SIGN-UP</span><span>NO KEY CUSTODY</span><span>LOCAL DERIVATION</span></div><p class="trust-caveat"><strong>Important:</strong> numbers invented by a human brain are useful as a thought experiment, but they are not reliable cryptographic entropy. For anything beyond education, use a cryptographically secure random source and appropriate wallet software.</p>`;
  desert.insertAdjacentElement('afterend',trust);
}

const toolLayout=document.querySelector('.tool-layout');
if(toolLayout){
  const news=document.createElement('section');
  news.className='news-pulse';
  news.id='news';
  news.innerHTML=`<div class="news-head"><div><div class="eyebrow">GLOBAL CRYPTO PULSE</div><h2>Bitcoin, blockchain & cryptography — now.</h2><p>Headlines are pulled from independent news providers and link directly to the original publisher.</p></div><div class="news-status"><span class="live-dot"></span><span id="newsUpdated">Loading live feed…</span></div></div><div id="newsGrid" class="news-grid"><div class="news-loading">Fetching latest headlines…</div></div><div class="news-foot">COBRA does not edit or endorse third-party headlines. Sources remain responsible for their reporting.</div>`;
  toolLayout.insertAdjacentElement('afterend',news);
  loadNews();
}

const community=document.querySelector('.community');
if(community){
  const nextChain=document.createElement('section');
  nextChain.className='next-chain';
  nextChain.innerHTML=`<div><div class="eyebrow">COBRA // NEXT NETWORK</div><h2>What blockchain would you like next?</h2><p>COBRA is Bitcoin-first. Help shape the next cryptographic address lab by opening a request on GitHub.</p></div><div class="chain-choices"><a href="https://github.com/ol-s-cloud/bitcoin-address-generator/issues/new?title=COBRA%20next%20network%3A%20Ethereum" target="_blank" rel="noopener noreferrer">Ethereum ↗</a><a href="https://github.com/ol-s-cloud/bitcoin-address-generator/issues/new?title=COBRA%20next%20network%3A%20Solana" target="_blank" rel="noopener noreferrer">Solana ↗</a><a href="https://github.com/ol-s-cloud/bitcoin-address-generator/issues/new?title=COBRA%20next%20network%3A%20Litecoin" target="_blank" rel="noopener noreferrer">Litecoin ↗</a><a href="https://github.com/ol-s-cloud/bitcoin-address-generator/issues/new?title=COBRA%20next%20network%20request" target="_blank" rel="noopener noreferrer">Other / suggest ↗</a></div>`;
  community.insertAdjacentElement('beforebegin',nextChain);
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
if(footer){footer.innerHTML=`<span>First rollout 2023 · Last updated 2026</span><span>COBRA <a href="https://github.com/ol-s-cloud/bitcoin-address-generator" target="_blank" rel="noopener noreferrer">by ol-s-cloud ↗</a></span>`;}
