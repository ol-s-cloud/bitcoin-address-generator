setTimeout(()=>{
  const community=document.querySelector('.community');
  if(community){
    const heading=community.querySelector('h2');
    if(heading){
      heading.innerHTML='Learn from it. <span class="dev-pun">F**k it.</span> Improve it.<span class="dev-pun-note">yes, that is a fork joke.</span>';
    }
  }
  if(!document.querySelector('link[href="/alive.css"]')){
    const style=document.createElement('link');
    style.rel='stylesheet';
    style.href='/alive.css';
    document.head.appendChild(style);
  }
},0);
