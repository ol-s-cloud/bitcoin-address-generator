(()=>{
  if(!document.querySelector('link[href="/news-visuals.css"]')){
    const style=document.createElement('link');
    style.rel='stylesheet';
    style.href='/news-visuals.css';
    document.head.appendChild(style);
  }
  const slug=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const decorate=()=>document.querySelectorAll('.news-card').forEach(card=>{
    const source=card.querySelector('.news-meta span')?.textContent?.trim();
    if(source)card.dataset.source=slug(source);
  });
  decorate();
  const grid=document.getElementById('newsGrid');
  if(grid){new MutationObserver(decorate).observe(grid,{childList:true,subtree:true});}
})();