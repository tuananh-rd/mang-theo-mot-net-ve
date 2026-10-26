import { viewport, go, screenshot, pause, close } from './browser.mjs';
for (const [w, h] of [[320, 640], [375, 812]]) { await viewport(w, h); await go('/'); await pause(400); await screenshot(`docs/evidence/MSH/after-fix/home-${w}x${h}-viewport.png`); }
close();
