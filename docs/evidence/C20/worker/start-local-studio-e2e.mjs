import os from 'node:os';
import path from 'node:path';
import { createStudioLocalServer } from '../../../../apps/studio/dist/server.js';

const dataDir = path.join(os.tmpdir(), 'mtmnv-c20-e2e-studio');
const app = createStudioLocalServer({ port: 4331, dataDir });
await app.start();
console.log('C20 local Studio/API emulator ready at http://127.0.0.1:4331');
console.log('Temporary SQLite data directory: ' + dataDir);
process.on('SIGINT', () => app.stop().finally(() => process.exit(0)));
process.on('SIGTERM', () => app.stop().finally(() => process.exit(0)));
