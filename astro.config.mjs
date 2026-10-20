// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';

// GitHub Pages serves the site under /winemaster; local dev runs at /.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://blockdreamers.github.io',
  base,
  trailingSlash: 'always',
  integrations: [mdx(), preact()],
});
