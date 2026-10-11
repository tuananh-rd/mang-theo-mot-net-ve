/**
 * Khởi chạy máy chủ Content Studio cục bộ (Task C17)
 * Cổng mặc định: 4330
 */

import { createStudioLocalServer } from './dist/server.js';

const port = process.env.STUDIO_PORT ? parseInt(process.env.STUDIO_PORT, 10) : 4330;
const app = createStudioLocalServer({ port });

app.start().then(() => {
  console.log(`[Studio] Content Studio đang chạy tại http://127.0.0.1:${port}`);
}).catch((err) => {
  console.error('[Studio] Khởi động thất bại:', err);
  process.exit(1);
});
