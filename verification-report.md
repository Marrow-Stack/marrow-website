# MarrowStack Verification Report

Generated: 2026-05-21T15:09:00.054Z

---

## Static & Build — 2026-05-21T15:09:00.055Z
- PASS: bun install (clean)
- FAIL: typecheck (zero errors) — Command failed: bunx tsc --noEmit 2>&1
- PASS: lint (zero errors)
- PASS: next build succeeds
- PASS: bundle size check (marketing routes <130KB)
- FAIL: no hardcoded hex/rgb colors — Found 299 hardcoded color(s):
- PASS: no console.log in app/api/
- PASS: schema.sql uses IF NOT EXISTS (idempotent)
- PASS: TactileButton has whileTap animation

## Static & Build — 2026-05-21T15:23:31.330Z
- PASS: bun install (clean)
- PASS: typecheck (zero errors)
- PASS: lint (zero errors)
- PASS: next build succeeds
- PASS: bundle size check (marketing routes <130KB)
- FAIL: no hardcoded hex/rgb colors (app, excluding og route and block demos) — Found 42 hardcoded color(s):
- PASS: no console.log in app/api/
- PASS: schema.sql uses IF NOT EXISTS (idempotent)
- PASS: TactileButton has whileTap animation

## Static & Build — 2026-05-21T15:30:59.266Z
- PASS: bun install (clean)
- PASS: typecheck (zero errors)
- PASS: lint (zero errors)
- PASS: next build succeeds
- PASS: bundle size check (marketing routes <130KB)
- PASS: no hardcoded hex/rgb colors (app, excluding og route and block demos)
- PASS: no console.log in app/api/
- PASS: schema.sql uses IF NOT EXISTS (idempotent)
- PASS: TactileButton has whileTap animation
