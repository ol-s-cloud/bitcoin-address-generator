import './news-visuals.js';
import './agents-home.js';
import './cli-status.js';
import './explorer-home.js';
setTimeout(()=>{
  const community=document.querySelector('.community');
  if(community){
    const heading=community.querySelector('h2');
    if(heading){
      heading.innerHTML='Learn from it. <span class="dev-pun">F**k it.</span> Improve it.<span class="dev-pun-note">yes, that is a fork joke.</span>';
    }
  }
  for(const href of ['/alive.css','/explorer-home.css']){
    if(!document.querySelector(`link[href="${href}"]`)){
      const style=document.createElement('link');
      style.rel='stylesheet';style.href=href;document.head.appendChild(style);
    }
  }
},0);
