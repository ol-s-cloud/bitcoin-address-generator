const heroBg=document.querySelector('.hero-bg-image');
if(heroBg){
  heroBg.src='/assets/cobra-lunar-network.svg';
  heroBg.style.objectPosition='center center';
}
const heroCredit=document.querySelector('.nasa-credit');
if(heroCredit){
  heroCredit.href='https://github.com/ol-s-cloud/bitcoin-address-generator';
  heroCredit.textContent='COBRA lunar-network artwork · by ol-s-cloud';
}

const existing=document.querySelector('.next-chain');
if(existing){
  const poll=document.createElement('section');
  poll.className='network-poll';
  poll.id='network-poll';
  poll.innerHTML=`
    <div class="poll-copy">
      <div class="eyebrow">COBRA // NEXT NETWORK</div>
      <h2>What blockchain would you like to see next?</h2>
      <p>Bitcoin is first. Vote for the next address lab, or suggest another network on GitHub.</p>
    </div>
    <div class="poll-meta"><span>Community signal</span><strong id="pollTotal">0 votes on this device</strong></div>
    <div class="poll-options" id="pollOptions"></div>
    <div class="poll-actions">
      <form id="addNetworkForm" class="add-network-form">
        <input id="newNetworkName" maxlength="40" placeholder="Add another network…" aria-label="Network name" />
        <button type="submit">Add to my poll</button>
      </form>
      <a class="poll-issue" href="https://github.com/ol-s-cloud/bitcoin-address-generator/issues/new?title=COBRA%20next%20network%20request&body=Network%3A%20%0A%0AWhy%20COBRA%20should%20support%20it%3A%20" target="_blank" rel="noopener noreferrer">Open a network request on GitHub ↗</a>
    </div>
    <p class="poll-note">Current v1 votes are stored locally in your browser. A shared global tally will require COBRA's planned public backend; GitHub requests are already public.</p>`;
  existing.replaceWith(poll);

  const KEY='cobra-next-network-poll-v1';
  const DEFAULTS=['Ethereum','Solana','Litecoin'];
  const state=loadPoll();
  renderPoll();

  document.getElementById('addNetworkForm').addEventListener('submit',event=>{
    event.preventDefault();
    const input=document.getElementById('newNetworkName');
    const name=input.value.trim().replace(/\s+/g,' ');
    if(!name)return;
    const match=Object.keys(state.options).find(key=>key.toLowerCase()===name.toLowerCase());
    if(!match)state.options[name]=0;
    input.value='';
    savePoll();renderPoll();
  });

  function loadPoll(){
    let stored={options:{},voted:null};
    try{stored=JSON.parse(localStorage.getItem(KEY)||'null')||stored}catch{}
    if(!stored.options||typeof stored.options!=='object')stored.options={};
    for(const item of DEFAULTS)if(!(item in stored.options))stored.options[item]=0;
    return stored;
  }
  function savePoll(){localStorage.setItem(KEY,JSON.stringify(state));}
  function vote(name){
    if(state.voted===name){state.options[name]=Math.max(0,(state.options[name]||0)-1);state.voted=null;}
    else{
      if(state.voted&&state.options[state.voted]!=null)state.options[state.voted]=Math.max(0,state.options[state.voted]-1);
      state.options[name]=(state.options[name]||0)+1;state.voted=name;
    }
    savePoll();renderPoll();
  }
  function renderPoll(){
    const options=document.getElementById('pollOptions');
    const entries=Object.entries(state.options).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
    const total=entries.reduce((sum,[,count])=>sum+count,0);
    document.getElementById('pollTotal').textContent=`${total} vote${total===1?'':'s'} on this device`;
    options.innerHTML=entries.map(([name,count])=>{
      const pct=total?Math.round((count/total)*100):0;
      const active=state.voted===name;
      return `<button class="poll-option${active?' selected':''}" type="button" data-network="${escapeAttr(name)}"><span class="poll-name">${escapeHtml(name)}</span><span class="poll-count">${count}</span><span class="poll-bar" style="--poll:${pct}%"></span></button>`;
    }).join('');
    options.querySelectorAll('.poll-option').forEach(button=>button.addEventListener('click',()=>vote(button.dataset.network)));
  }
}

const stylesheet=document.createElement('link');
stylesheet.rel='stylesheet';stylesheet.href='/poll.css';document.head.appendChild(stylesheet);
function escapeHtml(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function escapeAttr(v=''){return escapeHtml(v)}
