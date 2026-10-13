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
  integrations: [
    {
      name: 'snapshot-status-endpoint',
      hooks: {
        'astro:config:setup': ({ injectRoute }) => {
          injectRoute({
            pattern: '/_meta/snapshot-status.json',
            entrypoint: './src/pages/_meta/snapshot-status.json.ts',
          });
        },
      },
    },
  ],
});
