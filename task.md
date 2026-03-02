# Vista Source Pending Plan (Only)

**Date:** March 1, 2026  
**Repo Root:** `d:/Trying RSC/vista-source`

## Pending List

### 1. Formal Regression Tests (Phase 2)
1. Add hidden route safety tests:
   - `[not-found]` must never be public-routable.
   - `notFoundRoute` override must render custom 404 correctly.
2. Add metadata parity tests:
   - static `metadata` export
   - dynamic `generateMetadata`
   - optional `Head` path without duplicate/conflicting tags
3. Add SSR vs RSC parity tests:
   - same status code behavior
   - same not-found behavior
   - at least one nested/dynamic route parity case

### 2. Final Acceptance Gates (Phase 3)
1. Run infra gates on clean state:
   - `pnpm build`
   - `pnpm test`
   - `pnpm exec cargo test -p vista-transforms`
2. Run framework gates:
   - `pnpm --dir apps/web run build`
   - `pnpm --dir apps/web run build -- --rsc`
   - `pnpm --dir apps/web run start` (smoke)
   - `pnpm --dir apps/web run start -- --rsc` (smoke)
3. Runtime checks:
   - `/` returns deterministic SSR HTML (200)
   - `/rsc` returns `text/x-component`
   - unknown routes return 404 in legacy and RSC
   - `'use client'` islands hydrate
   - custom `notFoundRoute` override works

### 3. Release Evidence + Handoff Closure
1. Add one release evidence/status file with:
   - command
   - pass/fail
   - notes
2. Ensure only intentional milestone changes remain in final handoff set.
3. Keep public API unchanged:
   - `vista dev|build|start`, `--rsc`
   - `npx create-vista-app@latest <project-name>`

### 4. Cleanup Leftovers
1. Remove residual locked temp folder if still present:
   - `.test-app-deleted/` (Windows file lock residue)
2. Remove temporary smoke app if no longer needed for validation:
   - `tmp-cva-smoke/`

## Done Status (Reference)
- Phase 1 completed already (repo/source-dist consistency for `packages/vista`).
