# Deploying

The site is an Astro static build published to GitHub Pages at
https://thtpk.github.io/fallacy/

## How it is set up right now

Pages Source is **Deploy from a branch** (`main`, `/ (root)`). That makes
GitHub run its own Jekyll build over the repository root on every push, in
addition to `.github/workflows/deploy.yml`. Both publish to the same
`github-pages` environment, so **whichever finishes last wins**, and which
one that is varies run to run.

To make the site work either way, the built output is committed at the
repository root. The branch build serves it directly; the Actions workflow
serves the same files out of `dist/`.

### Updating the site

    npm run sync

That runs `astro build` and copies `dist/` to the root. **Run it before every
commit that changes anything under `src/`.** If you skip it, the Actions
deploy publishes the new pages and the branch build publishes the old ones,
and the live site flips between the two.

`scripts/sync-dist-to-root.mjs` records what it wrote in `.generated-files`
and deletes those entries before the next copy, so a page removed from `src/`
does not linger at the root.

### What this costs

Build output is in version control next to the source, so a one-line content
change produces a second, much larger diff. Reviewing history gets noisier,
and merge conflicts in generated files are possible. This is a workaround for
the setting below, not a design choice.

## The one-line fix

**Settings → Pages → Build and deployment → Source: GitHub Actions**

That stops the branch build from running at all and leaves `deploy.yml` as
the only publisher. The dropdown applies immediately; there is no Save
button. If a branch picker (`main`, `/ (root)`) is still visible underneath,
the change has not taken effect.

### How to confirm which mode is active

    curl -s "https://api.github.com/repos/ThTpk/fallacy/actions/runs?per_page=5"

Any run named `pages build and deployment` means the branch build is still
enabled. In GitHub Actions mode, only `Deploy to GitHub Pages` appears.

### Reverting the workaround afterwards

Once only `Deploy to GitHub Pages` runs:

1. `git rm -r --cached` the generated entries listed in `.generated-files`,
   then delete them from the working tree
2. delete `.generated-files`, `scripts/sync-dist-to-root.mjs` and the `sync`
   npm script
3. add them to `.gitignore` if anything is left behind

## Notes

**`.nojekyll`** comes from `public/.nojekyll`, so it lands at the root of
`dist/` and therefore at the repo root. Astro currently inlines all CSS and
emits no `_astro/` directory, so nothing depends on it today — but it costs
nothing and protects the build the moment an asset file does appear, since
Jekyll skips paths beginning with an underscore.

**Base path.** The repo is `ThTpk/fallacy`, not `ThTpk.github.io`, so the
site lives under `/fallacy/`. `astro.config.mjs` sets `base`,
`src/lib/text.ts` exports `url()` for links in `.astro` files, and a rehype
plugin in the config rewrites root-relative links written inside Markdown.
Never write a bare `href="/..."` by hand.
