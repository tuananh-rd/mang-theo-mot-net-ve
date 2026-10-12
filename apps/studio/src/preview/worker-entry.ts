/**
 * Entrypoint Worker Preview tích hợp trực tiếp với Astro SSR Cloudflare Handler (C17-R2-F2)
 * Statically compiled thông qua Astro build pipeline (astro.preview.config.mjs).
 */

// @ts-ignore
import { handle } from '@astrojs/cloudflare/handler';
import worker from '../worker.js';
import { setCustomAstroHandler } from './renderer.js';

// Đăng ký trực tiếp handler chính thức của Astro Cloudflare
setCustomAstroHandler(handle);

export default worker;
