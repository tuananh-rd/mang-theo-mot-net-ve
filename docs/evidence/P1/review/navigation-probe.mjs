import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {command,evaluate,viewport,navigate,screenshot,pause,close} from './browser.mjs';
const out={at:new Date().toISOString(),routes:[],sections:[]};
const press=async(key,code,virtual,text)=>{await command('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:virtual,...(text?{text,unmodifiedText:text}:{})});await command('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:virtual});};
try{
 for(const [w,h]of [[375,812],[768,1024],[1440,900]]){
  await viewport(w,h);await navigate('/');await evaluate(`document.querySelector('#plan-glance-heading').closest('section').scrollIntoView({block:'center',behavior:'instant'})`);await pause(400);await screenshot(`docs/evidence/P1/review/screenshots/home-plan-${w}.png`);
  await navigate('/du-an/mang-theo-mot-net-ve');await evaluate(`document.querySelector('.roadmap-board').scrollIntoView({block:'center',behavior:'instant'})`);await pause(400);await screenshot(`docs/evidence/P1/review/screenshots/project-progress-${w}.png`);out.sections.push({width:w,stage:await evaluate(`document.querySelector('.progress-current-stage').textContent.trim()`)});
 }
 await viewport(375,812);await navigate('/');await command('Page.bringToFront');await press('Tab','Tab',9);await pause(250);out.skip=await evaluate(`({class:document.activeElement.className,y:document.activeElement.getBoundingClientRect().top})`);assert.ok(out.skip.class.includes('skip-link'));assert.ok(out.skip.y>=0);await press('Enter','Enter',13,'\r');out.skipTarget=await evaluate('document.activeElement.id');assert.equal(out.skipTarget,'main-content');
 await evaluate(`document.querySelector('#mobile-nav-toggle').click()`);out.menuOpen=await evaluate(`document.querySelector('#mobile-nav-toggle').getAttribute('aria-expanded')`);assert.equal(out.menuOpen,'true');await press('Escape','Escape',27);out.menuClosed=await evaluate(`document.querySelector('#mobile-nav-toggle').getAttribute('aria-expanded')`);assert.equal(out.menuClosed,'false');
 for(const route of ['/','/du-an/mang-theo-mot-net-ve','/nhat-ky','/san-pham','/san-pham/moc-khoa','/san-pham/chuon-chuon-tre-kem-de','/minh-bach','/ve-nhom','/dong-hanh']){
  const response=await fetch('http://127.0.0.1:4383'+route),html=await response.text();assert.equal(response.status,200,route);assert.equal((html.match(/<h1[\s>]/g)||[]).length,1,route);assert.match(response.headers.get('x-robots-tag')||'',/noindex/);out.routes.push({route,status:response.status,noindex:response.headers.get('x-robots-tag')});
 }
 await navigate('/dong-hanh');await evaluate(`document.querySelector('details summary').focus()`);await press('Enter','Enter',13,'\r');out.faqEnter=await evaluate(`document.querySelector('details').open`);assert.equal(out.faqEnter,true);await press(' ','Space',32,' ');out.faqSpace=await evaluate(`document.querySelector('details').open`);assert.equal(out.faqSpace,false);
 out.passed=true;
}catch(error){out.passed=false;out.failure=String(error);process.exitCode=1;}finally{await fs.writeFile('docs/evidence/P1/review/navigation-review.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));close();}
