// L1: ảnh chụp viewport quanh bảng sổ ủng hộ (#sao-ke) và bảng tổng quan Minh bạch. Chạy: L1_BASE=... L1_LABEL=preview node docs/evidence/L1/worker/shots.mjs
import { viewport, go, evaluate, screenshot, pause, close } from './browser.mjs';
const out = process.env.L1_OUT || 'docs/evidence/L1/worker/after';
const label = process.env.L1_LABEL || 'preview';
for (const [w, h] of [[375, 812], [768, 1024], [1440, 900]]) {
  await viewport(w, h);
  await go('/dong-hanh'); await pause(400);
  await evaluate(`document.getElementById('sao-ke').scrollIntoView({block:'start',behavior:'instant'})`); await pause(250);
  await screenshot(`${out}/${label}-ledger-${w}-viewport.png`);
  await evaluate(`scrollBy({top:${h - 120},behavior:'instant'})`); await pause(250);
  await screenshot(`${out}/${label}-ledger-${w}-viewport-2.png`);
  await go('/minh-bach'); await pause(400);
  await evaluate(`document.getElementById('tong-quan').scrollIntoView({block:'start',behavior:'instant'})`); await pause(250);
  await screenshot(`${out}/${label}-overview-${w}-viewport.png`);
  await go('/'); await pause(400);
  await evaluate(`document.getElementById('donate-heading').scrollIntoView({block:'center',behavior:'instant'})`); await pause(300);
  await screenshot(`${out}/${label}-home-donate-${w}-viewport.png`);
}
close();
