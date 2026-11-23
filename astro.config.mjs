import { defineConfig } from 'astro/config';

// The repo is ThTpk/fallacy, not ThTpk.github.io, so the site is served
// from a subpath. Every internal link must go through url() in src/lib/text.ts.
export default defineConfig({
  site: 'https://thtpk.github.io',
  base: '/fallacy',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
