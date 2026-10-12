import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  outDir: './dist-preview',
  adapter: cloudflare({
    imageService: 'passthrough',
    configPath: './wrangler.preview.json',
  }),
  session: false,
  trailingSlash: 'never',
});
