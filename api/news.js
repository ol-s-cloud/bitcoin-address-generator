const FEEDS=[
  {name:'CoinDesk',url:'https://www.coindesk.com/arc/outboundfeeds/rss/'},
  {name:'Cointelegraph',url:'https://cointelegraph.com/rss'},
  {name:'Decrypt',url:'https://decrypt.co/feed'},
  {name:'Bitcoin Magazine',url:'https://bitcoinmagazine.com/.rss/full/'},
  {name:'Blockworks',url:'https://blockworks.co/feed'},
  {name:'CryptoSlate',url:'https://cryptoslate.com/feed/'},
  {name:'NewsBTC',url:'https://www.newsbtc.com/feed/'},
  {name:'Bitcoinist',url:'https://bitcoinist.com/feed/'}
];

export default async function handler(req,res){
  try{
    const results=await Promise.allSettled(FEEDS.map(async feed=>{
      const response=await fetch(feed.url,{headers:{'User-Agent':'COBRA/1.0 (+https://github.com/ol-s-cloud/bitcoin-address-generator)','Accept':'application/rss+xml, application/xml, text/xml, */*'}});
      if(!response.ok)throw new Error(`${feed.name}: ${response.status}`);
      const xml=await response.text();
      return parseFeed(xml,feed.name);
    }));
    const seen=new Set();
    const items=results.flatMap(r=>r.status==='fulfilled'?r.value:[])
      .filter(x=>x.title&&x.link)
      .filter(item=>{const key=item.link.replace(/[?#].*$/,'').toLowerCase();if(seen.has(key))return false;seen.add(key);return true;})
      .sort((a,b)=>new Date(b.published||0)-new Date(a.published||0))
      .slice(0,32);
    const sources=[...new Set(items.map(item=>item.source))];
    res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=900');
    res.status(200).json({updatedAt:new Date().toISOString(),sources,items});
  }catch(error){res.status(500).json({error:'news_unavailable'});}
}

function parseFeed(xml,source){
  const rss=[...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map(m=>m[0]);
  const atom=[...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map(m=>m[0]);
  const blocks=rss.length?rss:atom;
  return blocks.map(block=>({
    source,
    title:decode(getTag(block,'title')),
    link:decode(getTag(block,'link')||getAtomLink(block)),
    published:decode(getTag(block,'pubDate')||getTag(block,'published')||getTag(block,'updated')||getTag(block,'dc:date')||getTag(block,'date'))
  }));
}
function getAtomLink(block){const match=block.match(/<link[^>]+href=['\"]([^'\"]+)['\"][^>]*\/?\s*>/i);return match?match[1]:'';}
function getTag(block,tag){
  const safe=tag.replace(':','\\:');
  const match=block.match(new RegExp(`<${safe}[^>]*>([\\s\\S]*?)<\\/${safe}>`,'i'));
  if(!match)return'';
  return match[1].replace(/^<!\[CDATA\[/,'').replace(/\]\]>$/,'').trim();
}
function decode(value=''){
  return String(value).replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/<[^>]+>/g,'').trim();
}
