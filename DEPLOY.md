# Deploying

The site is an Astro static build published to GitHub Pages at
https://thtpk.github.io/fallacy/

## One setting has to be right

**Settings → Pages → Build and deployment → Source: GitHub Actions**

If Source is left on "Deploy from a branch", GitHub runs its own
`pages build and deployment` workflow on every push *in addition to*
`.github/workflows/deploy.yml`. Both publish to the same `github-pages`
environment, so whichever finishes last wins.

The branch build runs Jekyll over the repository source, which has no
`index.html` at the root, so when it wins the whole site returns 404 —
including pages that worked minutes earlier. The symptom looks like a
broken build, but both workflows report success.

Switching Source to "GitHub Actions" stops the branch build from running
at all and leaves `deploy.yml` as the only publisher.

## How to tell which mode is active

List the recent runs:

    curl -s "https://api.github.com/repos/ThTpk/fallacy/actions/runs?per_page=5"

Any run named `pages build and deployment` means the branch build is still
enabled. Only `Deploy to GitHub Pages` should appear.

## public/.nojekyll

Astro emits assets into `_astro/`. Jekyll skips directories that start with
an underscore, so under the branch build the CSS and JS would 404 even if
the HTML were served. `public/.nojekyll` is copied to the root of `dist/`
and turns Jekyll processing off. It is insurance; it does not remove the
need for the setting above.

## Base path

The repo is `ThTpk/fallacy`, not `ThTpk.github.io`, so the site lives under
`/fallacy/`. `astro.config.mjs` sets `base`, `src/lib/text.ts` exports
`url()` for links in `.astro` files, and a rehype plugin in the config
rewrites root-relative links written inside Markdown. Never write a bare
`href="/..."` by hand.
