// Copies the contents of dist/ to the repository root.
//
// Why this exists: GitHub Pages for this repo is set to "Deploy from a
// branch", so GitHub runs its own Jekyll build over the repository root on
// every push, in addition to .github/workflows/deploy.yml. Both publish to
// the same environment and whichever finishes last wins. Keeping a copy of
// the built site at the root means the site works either way.
//
// The cost: build output is committed alongside the source, so every content
// change produces a second, larger diff. Switching Pages Source to
// "GitHub Actions" removes the need for this script entirely — see DEPLOY.md.
//
// Run it through `npm run sync`, never by hand, so the root copy cannot drift
// from src/.

import { cp, rm, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

// Everything the build owns at the root. Removed before each copy so a page
// deleted from src/ does not linger as a stale file on the live site.
const MANIFEST = join(root, '.generated-files');

if (!existsSync(dist)) {
  console.error('dist/ not found — run `npm run build` first');
  process.exit(1);
}

// 1. remove what the previous sync wrote
if (existsSync(MANIFEST)) {
  const previous = (await import('node:fs')).readFileSync(MANIFEST, 'utf8');
  for (const name of previous.split('\n').map((s) => s.trim()).filter(Boolean)) {
    if (name.startsWith('.') && name !== '.nojekyll') continue;
    if (['src', 'public', 'scripts', 'node_modules', '.git', '.github'].includes(name)) {
      throw new Error(`refusing to remove ${name}`);
    }
    await rm(join(root, name), { recursive: true, force: true });
  }
}

// 2. copy the fresh build
const entries = await readdir(dist);
for (const name of entries) {
  await cp(join(dist, name), join(root, name), { recursive: true, force: true });
}

// 3. record what was written, for the next run
await writeFile(MANIFEST, entries.join('\n') + '\n', 'utf8');

console.log(`synced ${entries.length} entries from dist/ to the repo root:`);
console.log('  ' + entries.join('  '));
console.log('these files are build output — edit src/, then run npm run sync');
