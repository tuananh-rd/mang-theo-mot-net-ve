import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const dir='docs/evidence/T01/ui-claude';
const result=JSON.parse(fs.readFileSync(dir+'/reviewer-browser-'+sha.slice(0,7)+'.json','utf8'));
const checks=[];
function verify(name,pass,observed){checks.push({name,pass:Boolean(pass),observed});}
verify('Reviewed committed app stayed unchanged',result.sha===result.shaAtEnd&&!result.appDiffAtStart&&!result.appDiffAtEnd,{sha:result.sha,shaAtEnd:result.shaAtEnd,appDiffAtStart:result.appDiffAtStart,appDiffAtEnd:result.appDiffAtEnd});
for(const r of result.routes){
const notFound=r.route.includes('does-not-exist');
verify('HTTP direct/reload '+r.route,notFound?r.status===404&&r.reloadStatus===404:r.status===200&&[200,304].includes(r.reloadStatus),{status:r.status,reloadStatus:r.reloadStatus});
verify('Current navigation '+r.route,notFound?r.activeHrefs.length===0:r.activeHrefs.length>0&&r.activeHrefs.every(x=>x===r.route),r.activeHrefs);
verify('Preview landmarks/privacy '+r.route,r.lang==='vi'&&r.h1===1&&r.main===1&&r.header&&r.footer&&r.forms===0&&r.robots==='noindex, nofollow',r);
verify('Figure and static status semantics '+r.route,r.badFigcaption===0&&r.staticLiveRegions===0,{badFigcaption:r.badFigcaption,staticLiveRegions:r.staticLiveRegions});
}
function luminance(hex){const vals=(hex.trim().match(/[a-f0-9]{2}/gi)||[]).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return vals.reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0)}
for(const v of result.responsive){
verify('No horizontal overflow '+v.width,v.scrollWidth<=v.width,{width:v.width,scrollWidth:v.scrollWidth});
verify('Text contrast '+v.width,v.contrastFailures.length===0,v.contrastFailures);
verify('Readable small text '+v.width,v.tinyText.length===0,v.tinyText);
verify('Section notes 14px nonitalic '+v.width,v.sectionNotes.every(n=>n.fontSize==='14px'&&n.fontStyle==='normal'),v.sectionNotes);
verify('Muted not darker than secondary '+v.width,luminance(v.muted)>=luminance(v.secondary),{muted:v.muted,secondary:v.secondary});
verify('Product hierarchy and no broken inline label '+v.width,v.productOrders.every(p=>!p.oldStatusTag&&p.name&&p.price&&p.name.bottom<=p.price.top+.5),v.productOrders);
verify('Footer touch targets '+v.width,v.footerTargets.length===6&&v.footerTargets.every(x=>x.height>=44),v.footerTargets);
verify('Stage labels '+v.width,v.badStageLabels===0,v.badStageLabels);
verify('Support grid columns '+v.width,v.supportGrid.trim().split(/\s+/).length===(v.width>=1024?3:v.width>=768?2:1),v.supportGrid);
if(v.width<768)verify('Mobile banner compact '+v.width,v.previewBanner.height<=48,v.previewBanner);
// Review decision: prefer 16:9, allow the documented 165px height cap to
// make the box slightly wider. SVG contain and complete artwork checked visually.
if(v.width<768)verify('Mobile card visual preferred 16:9 with 165px height cap '+v.width,v.illustrations.length===7&&v.illustrations.every(x=>x.width>0&&x.height>0&&x.height<=165.5&&x.width/x.height>=16/9-.03&&x.width/x.height<2),v.illustrations);
if(v.width===768)verify('Tablet hero bounded',v.heroVisual.width<=560.5,v.heroVisual);
if(v.width===375){
verify('Mobile hero visual and title on first viewport',v.heroVisual.top>=0&&v.heroVisual.bottom<=812&&v.heroTitle.bottom<=812,{visual:v.heroVisual,title:v.heroTitle});
verify('Mobile primary CTA inside first viewport',v.heroCTA.bottom<=812,v.heroCTA);
verify('Mobile page at least 15% shorter',v.scrollHeight<=8920,{before:10496,after:v.scrollHeight,reductionPercent:100*(10496-v.scrollHeight)/10496});
}
}
const m=result.menu;
verify('Skip link keyboard',m.skipTab==='skip-link'&&m.skipEnter==='main-content',m);
verify('Menu opens and first link focus',m.open&&m.firstTab.inside&&m.firstTab.outline.includes('solid 2px'),m.firstTab);
verify('Escape closes and returns focus',m.escape.hidden&&m.escape.expanded==='false'&&m.escape.focus==='mobile-nav-toggle',m.escape);
verify('Closed panel skipped by Tab',!m.closedTab.inside,m.closedTab);
verify('Menu link navigates and closes',m.link.url==='/san-pham'&&m.link.expanded==='false',m.link);
verify('Resize hides mobile menu',!m.resize.panelVisible&&m.resize.desktopNavVisible,m.resize);
verify('No-JS menu has no inert toggle and footer routes remain',!result.nojsToggleVisible&&result.nojsFooterRoutes.length===6,{toggleVisible:result.nojsToggleVisible,routes:result.nojsFooterRoutes});
verify('Favicon responds',result.iconResponse.status===200&&result.iconResponse.contentType.includes('svg'),result.iconResponse);
verify('No JS runtime error',result.errors.length===0,result.errors);
verify('Reduced motion',parseFloat(result.reducedMotion)<.01,result.reducedMotion);
const report={sha,checkedAt:new Date().toISOString(),checks,failed:checks.filter(x=>!x.pass)};
fs.writeFileSync(dir+'/reviewer-assertions-'+sha.slice(0,7)+'.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({sha,total:checks.length,failed:report.failed},null,2));
if(report.failed.length)process.exitCode=1;
