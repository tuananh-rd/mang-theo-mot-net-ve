import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  trailingSlash: 'never',
  server: {
    host: '127.0.0.1',
    port: 4321,
  },
  integrations: [
    {
      name: 'clean-dist-artifacts',
      hooks: {
        'astro:build:done': ({ dir }) => {
          const distPath = fileURLToPath(dir);
          const imagesDir = path.join(distPath, 'images');
          if (fs.existsSync(imagesDir)) {
            const readmePath = path.join(imagesDir, 'README.md');
            if (fs.existsSync(readmePath)) {
              fs.unlinkSync(readmePath);
            }
            if (fs.existsSync(imagesDir) && fs.readdirSync(imagesDir).length === 0) {
              fs.rmSync(imagesDir, { recursive: true, force: true });
            }
          }
        },
      },
    },
  ],
});
