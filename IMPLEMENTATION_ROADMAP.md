# Makenna Learning Lab — Implementation Roadmap

This roadmap turns the current PWA into a production-quality children's learning app.
Each phase is implemented, verified (`lint`, `test`, `build`, `git diff --check`) and committed separately.

Legend: `[ ]` planned · `[~]` in progress · `[x]` done

---

## Phase 0 — Baseline ✅
- [x] Hard audit and dependency cleanup
- [x] Fix console warnings and speech noise
- [x] Make every game route playable
- [x] Fix avatar store purchase crash
- [x] Repair tracing engine (real letter paths, coordinate normalization, live progress, undo/redo)

## Phase 1 — Trust & reliability `[~]`
- [ ] Add Vitest + React Testing Library + jsdom
- [ ] Unit tests for tracing validation, reward purchasing, game configs, mission logic
- [ ] GitHub Actions CI (lint, test, build, audit)
- [ ] Unify avatar/reward/gamification catalogs into one source of truth
- [ ] Versioned local-storage migration layer, initialized before app render
- [ ] Central error-reporting service wired to ErrorBoundary
- [ ] Resolve stale-closure lint warnings in touched files

## Phase 2 — Daily Mission path `[ ]`
- [ ] Adaptive 10–15 minute daily mission: review → lesson → game → reward
- [ ] Mission service with streak/mastery-driven selection
- [ ] `/mission` page and home navigation entry
- [ ] Mission completion feeds gamification and progress services

## Phase 3 — Parent dashboard `[ ]`
- [ ] Weekly activity, mastery by skill, streaks, time-on-task
- [ ] "What Makenna learned this week" summary
- [ ] Screen-time limits, safe mode, content toggles
- [ ] Printable/exportable progress report

## Phase 4 — Teacher / classroom mode `[ ]`
- [ ] Class roster and child linking
- [ ] Assignments and curriculum-aligned lesson plans
- [ ] Class progress view
- [ ] Printable certificates and worksheets

## Phase 5 — Offline-first sync `[ ]`
- [ ] Sync queue with deterministic conflict resolution
- [ ] Visible sync status and "Sync now" control
- [ ] Supabase Row Level Security guidance/migration updates
- [ ] Offline export/import for schools

## Phase 6 — Accessibility, safety & privacy `[ ]`
- [ ] Full keyboard/switch-control operation for games and tracing
- [ ] Dyslexia-friendly font option and sound-sensitivity/captions toggle
- [ ] Parent gate for sensitive settings
- [ ] Privacy disclosure and data-deletion flow
- [ ] Session timeout wired to actual service

## Phase 7 — Portfolio, certificates & sticker book `[ ]`
- [ ] Saved tracing/drawing portfolio with before/after view
- [ ] Achievement certificates (canvas/print)
- [ ] Sticker book tied to the unified reward catalog

## Phase 8 — Differentiators `[ ]`
- [ ] Curriculum-grounded, parent-controlled AI tutor
- [ ] Camera scavenger hunt
- [ ] Spaced-repetition revision planner
- [ ] Two-player local co-op arcade game
- [ ] Ghana-language content packs

---

## Verification standard for every phase

```bash
npm run lint
npm test
npm run build
git diff --check
```

Commit message format: `feat(<phase>): <short description>`.
