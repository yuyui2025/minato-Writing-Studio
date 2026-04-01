# AGENTS.md

## Project workflow quickstart

1. Install dependencies: `npm install`
2. Create env file: `cp .env.example .env`
3. Start local dev server: `npm run dev`
4. Run quality checks before commit:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test:run`

## Recommended implementation workflows

### Frontend/UI changes (React + Vite)
1. Implement UI/state updates under `src/`.
2. Verify behavior in development with `npm run dev`.
3. Run `npm run lint` and `npm run typecheck`.
4. Run related tests with `npm run test:run`.

### API changes (`api/`)
1. Update endpoint and shared logic in `api/` and `api/_lib/`.
2. Confirm local build succeeds with `npm run build`.
3. Run `npm run test:run` for regressions.

### Database changes (Supabase)
1. Add a new SQL migration under `supabase/migrations/`.
2. Keep migrations atomic and reversible when possible.
3. Document behavior changes in `CHANGELOG.md` or `RELEASE_NOTES.md` when user-visible.

### WASM analyzer changes
1. Update Rust sources under `rust/text-analyzer/`.
2. Rebuild wasm bundle with `npm run build:wasm`.
3. Run `npm run typecheck` and `npm run test:run`.

## Command reference

- `npm run dev` — start Vite dev server.
- `npm run build` — TypeScript no-emit check + production build.
- `npm run preview` — preview built app locally.
- `npm run lint` — run ESLint.
- `npm run typecheck` — run TypeScript type checking.
- `npm run test` — run Vitest in watch mode.
- `npm run test:run` — run Vitest once.
- `npm run build:wasm` — compile Rust wasm module into `src/wasm/text_analyzer`.

## Commit checklist

- [ ] Keep changes focused and minimal.
- [ ] Run lint/typecheck/tests relevant to touched files.
- [ ] Update docs when behavior or workflows change.
