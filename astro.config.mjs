import { defineConfig } from 'astro/config';

// The repo is ThTpk/fallacy, not ThTpk.github.io, so the site is served from
// a subpath. Internal links in .astro files go through url() in src/lib/text.ts;
// links written inside Markdown bodies are rewritten here instead, so content
// authors can write "/fallacy/straw-man" and never think about the base.
const BASE = '/fallacy';

function rehypeBaseLinks() {
  const walk = (node) => {
    if (
      node.tagName === 'a' &&
      node.properties &&
      typeof node.properties.href === 'string' &&
      node.properties.href.startsWith('/') &&
      !node.properties.href.startsWith('//')
    ) {
      node.properties.href = BASE + node.properties.href;
    }
    for (const child of node.children ?? []) walk(child);
  };
  return (tree) => walk(tree);
}

export default defineConfig({
  site: 'https://thtpk.github.io',
  base: BASE,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  markdown: {
    rehypePlugins: [rehypeBaseLinks],
    // dual themes so code blocks follow the page, not a fixed dark block
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
});
