export function inspect(){
 const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right}};
 const visible=e=>{for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||s.opacity==='0')return false;}const r=rect(e);if(!r.width||!r.height)return false;const closed=e.closest('details:not([open])');return !closed||!!e.closest('summary');};
 const exclude=e=>e.closest('script,style,.sr-only,.skip-link,.honeypot,[aria-hidden="true"]');
 const clipped=[],pairs=new Map();
 const rgb=s=>s.match(/[\d.]+/g)?.map(Number)||[0,0,0,0];
 const blend=(f,b)=>{const a=f[3]??1;return f.slice(0,3).map((v,i)=>v*a+b[i]*(1-a));};
 const bg=e=>{const stack=[];for(let p=e;p;p=p.parentElement)stack.unshift(rgb(getComputedStyle(p).backgroundColor));return stack.reduce((b,f)=>blend(f,b),[255,255,255]);};
 const lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){
  const n=walker.currentNode,e=n.parentElement;if(!n.textContent.trim()||exclude(e)||!visible(e))continue;
  const range=document.createRange();range.selectNodeContents(n);
  for(const r of range.getClientRects())for(let p=e;p&&p!==document.body;p=p.parentElement){const s=getComputedStyle(p),b=p.getBoundingClientRect();if((['hidden','clip'].includes(s.overflowX)&&(r.left<b.left-1||r.right>b.right+1))||(['hidden','clip'].includes(s.overflowY)&&(r.top<b.top-1||r.bottom>b.bottom+1))){clipped.push({text:n.textContent.trim().slice(0,70),ancestor:p.className});break;}}
  const s=getComputedStyle(e),b=bg(e),f=blend(rgb(s.color),b),l=[lum(f),lum(b)].sort((a,b)=>b-a),key=f.join(',')+'/'+b.join(',');
  if(!pairs.has(key))pairs.set(key,{foreground:f,background:b,ratio:Math.round((l[0]+.05)/(l[1]+.05)*100)/100,example:n.textContent.trim().slice(0,60)});
 }
 const controls=[...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex="0"]')].filter(e=>visible(e)&&!exclude(e));
 const short=controls.filter(e=>rect(e).height<43.9||rect(e).width<43.9).map(e=>({tag:e.tagName,text:(e.textContent||e.getAttribute('aria-label')||e.id).trim().slice(0,65),...rect(e)}));
 const root=document.documentElement,h1=document.querySelector('h1');
 const overflowing=[...document.querySelectorAll('main *')].filter(e=>visible(e)&&rect(e).right>root.clientWidth+1&&!e.closest('.data-table-wrap,.ledger-table-wrap')).slice(0,10).map(e=>({class:e.className,...rect(e)}));
 return{width:innerWidth,height:innerHeight,pageHeight:root.scrollHeight,overflow:Math.max(0,root.scrollWidth-root.clientWidth),overflowing,h1Count:document.querySelectorAll('h1').length,h1:h1&&rect(h1),h1Text:h1?.textContent.trim(),clipped,shortTargets:short,contrast:[...pairs.values()],fonts:performance.getEntriesByType('resource').filter(r=>r.name.includes('/fonts/')).map(r=>({url:r.name,bytes:r.decodedBodySize})),images:[...document.images].map(i=>({src:i.currentSrc,loading:i.loading,bytes:performance.getEntriesByName(i.currentSrc)[0]?.decodedBodySize||0})),links:[...document.querySelectorAll('a[href]')].map(a=>a.href).filter(h=>h.startsWith(location.origin)),header:document.querySelector('.page-header')?.className||'home',bar:document.querySelector('.mobile-sticky-bar')?.className};
}
