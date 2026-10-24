// Independent browser review of the approved public baseline patch; no redesign code imported.
import fs from 'node:fs/promises';
const pages=await (await fetch('http://127.0.0.1:9394/json')).json();
const page=pages.find(item=>item.type==='page');
if(!page)throw new Error('Missing independent review page');
const wire=new WebSocket(page.webSocketDebuggerUrl),queue=new Map();let id=0;
await new Promise((resolve,reject)=>{wire.addEventListener('open',resolve,{once:true});wire.addEventListener('error',reject,{once:true});});
wire.addEventListener('message',event=>{const item=JSON.parse(event.data);const pending=queue.get(item.id);if(!pending)return;queue.delete(item.id);clearTimeout(pending.timeout);if(item.error)pending.reject(Error(JSON.stringify(item.error)));else pending.resolve(item.result);});
export function command(method,params={}){return new Promise((resolve,reject)=>{const request=++id;const timeout=setTimeout(()=>{queue.delete(request);reject(Error('CDP timeout: '+method));},20000);queue.set(request,{resolve,reject,timeout});wire.send(JSON.stringify({id:request,method,params}));});}
export async function evaluate(expression){const result=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;}
export const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function viewport(width,height){await command('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<=768});}
export async function navigate(path='/'){
 const destination=new URL(path,'http://127.0.0.1:4383');if(destination.hostname!=='127.0.0.1'||destination.port!=='4383')throw Error('Nonlocal review navigation refused');
 const response=await command('Page.navigate',{url:destination.href});if(response.errorText)throw Error(response.errorText);
 for(let attempt=0;attempt<120;attempt++){await pause(50);if(await evaluate(`location.href===${JSON.stringify(destination.href)}&&document.readyState==='complete'`))break;}
 await evaluate('document.fonts.ready.then(()=>true)');await pause(600);
}
export async function screenshot(file,full=false){const layout=await command('Page.getLayoutMetrics');const params={format:'png',captureBeyondViewport:full};if(full)params.clip={x:0,y:0,width:layout.cssContentSize.width,height:layout.cssContentSize.height,scale:1};const result=await command('Page.captureScreenshot',params);await fs.writeFile(file,Buffer.from(result.data,'base64'));}
export async function revealPage(){await evaluate(`(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=innerHeight*.8){scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,100));}scrollTo({top:0,behavior:'instant'});return true})()`);await pause(700);}
export function close(){wire.close();}
await command('Page.enable');await command('Runtime.enable');await command('Network.enable');
// External production requests are denied even if a future script accidentally changes its API base.
await command('Network.setBlockedURLs',{urls:['https://*','http://mangtheomotnetve.website/*']});
