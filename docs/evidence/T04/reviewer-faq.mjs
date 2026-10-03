import fs from 'node:fs';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const reviewerRequire=createRequire('file:///C:/Users/tuana/.gemini/antigravity-cli/brain/86498389-9ca4-486e-9ba8-82247107fb96/scratch/take_screenshots.mjs');
const puppeteer=reviewerRequire('puppeteer-core'),sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-gpu']}),results=[];
try{
 for(const [name,route] of [['finance','/minh-bach'],['support','/dong-hanh']]){
  const page=await browser.newPage();await page.setViewport({width:375,height:812,deviceScaleFactor:1});
  await page.goto('http://127.0.0.1:4321'+route,{waitUntil:'networkidle0'});
  const summary=await page.$('main details summary');await summary.focus();await page.keyboard.press('Enter');
  const opened=await page.evaluate(()=>{const d=document.querySelector('main details'),p=d.querySelector('p'),s=getComputedStyle(document.activeElement);return {open:d.open,answerHeight:p.getBoundingClientRect().height,fontSize:parseFloat(getComputedStyle(p).fontSize),outlineStyle:s.outlineStyle,outlineWidth:parseFloat(s.outlineWidth),outlineColor:s.outlineColor,focusedSummary:document.activeElement===d.querySelector('summary')}});
  await summary.evaluate(e=>e.scrollIntoView({block:'center'}));
  await page.screenshot({path:'docs/evidence/T04/reviewer-'+sha.slice(0,7)+'-'+name+'-375-faq-focus.png'});
  await page.keyboard.press('Space');const closed=await page.$eval('main details',e=>!e.open);
  results.push({page:name,...opened,closed,pass:opened.open&&opened.answerHeight>0&&opened.fontSize>=14&&opened.focusedSummary&&opened.outlineStyle!=='none'&&opened.outlineWidth>0&&closed});
  await page.close();
 }
}finally{await browser.close()}
const result={sha,checkedAt:new Date().toISOString(),reason:'R04 targeted capture of open native FAQ and visible keyboard focus; the full browser audit passed but did not save this representative image',results};
fs.writeFileSync('docs/evidence/T04/reviewer-faq-'+sha.slice(0,7)+'.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result));if(results.some(item=>!item.pass))process.exitCode=1;
