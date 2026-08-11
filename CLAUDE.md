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

## Testing

**On Windows, `npm test` silently skips 7 of 25 test files.** Workers time out, the files never run, and the
summary still prints `Test Files 18 passed (18)`. Always use:

```bash
npx vitest run --project unit --no-file-parallelism
```

Vitest has no `coverage.all`/`include` config, so the reported percentage counts only files the tests
imported — untouched files are excluded from the denominator, not scored as 0.

## Gotchas

- **`react-hook-form`, `zod`, and `framer-motion` are not installed.** Propose before adding either forms
  validation or an animation library.
- **Never edit `src/app/styles/tokens.generated.css`.** It is generated from `src/shared/tokens/tokens.json`
  by `scripts/sd.config.mjs` and overwritten on every `dev`/`build`.
- `next.config.ts` aliases `msw/browser` to a stub when `NEXT_PUBLIC_MOCK_ENABLED !== 'true'`, keeping ~119KB
  gzip out of the bundle. Changing MSW import paths silently undoes this — update the alias too.
- SEO canonical host is `SITE_URL` in `src/shared/config/site.ts`, not `NEXT_PUBLIC_APP_URL`
  (the latter varies per environment).
- Access tokens live in memory only (`src/shared/api/authStore.ts`); refresh tokens are httpOnly cookies.
  Do not persist tokens to localStorage.
- **`src/proxy.ts` has `FORCE_LOGIN = true`, which disables the middleware auth guard entirely** (issue #14).
  Protected routes are currently gated on the client only.
- ESLint 9 flat config does not read `.gitignore` — add new build output dirs to `globalIgnores` by hand.
- Root `pages/` is a README, not the Pages Router. Middleware is `src/proxy.ts` (Next 16 rename).
- `shared/` and `entities/` currently import from `features/` (issue #16). Known violation — do not extend it.
- Never put real values in `.env`.
