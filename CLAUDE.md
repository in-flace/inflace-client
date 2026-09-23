# CLAUDE.md

inflace (인플레이스) — YouTube influencer analytics platform. Frontend only.
Product context: `README.md`. Stack: `package.json`.

## Working agreement

- Respond in Korean.
- Do not write code until explicitly asked. Analyze and propose first.
- Code comments in Korean, explaining **why** rather than what.
- Build only what was asked.

## Architecture

FSD, one-way imports: `app → pages → widgets → features → entities → shared`. Cross-slice only via the
slice root `index.ts`.

`app/` is routing only — metadata plus a re-export of `src/pages/*`. Never put components there.

## Gotchas

- **`react-hook-form`, `zod`, and `framer-motion` are not installed.** Propose before adding either forms
  validation or an animation library.
- **Never edit `src/app/styles/tokens.generated.css`.** It is generated from `src/shared/tokens/tokens.json`
  by `scripts/sd.config.mjs` and overwritten on every `dev`/`build`.
- `next.config.ts` aliases `msw/browser` to a stub when `NEXT_PUBLIC_MOCK_ENABLED !== 'true'`, keeping ~119KB
  gzip out of the bundle. Changing MSW import paths silently undoes this — update the alias too.
- SEO canonical host is `SITE_URL` in `src/shared/config/site.ts`, not `NEXT_PUBLIC_APP_URL`
  (the latter varies per environment).
- Access tokens live in memory only (`src/entities/user/model/authStore.ts`); refresh tokens are httpOnly
  cookies. Do not persist tokens to localStorage.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
