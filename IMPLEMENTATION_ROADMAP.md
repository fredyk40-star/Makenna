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

## Phase 1 — Trust & reliability `[x]`
- [x] Add Vitest + React Testing Library + jsdom
- [x] Unit tests for tracing validation, reward purchasing, game configs, mission logic
- [x] GitHub Actions CI (lint, test, build, audit)
- [x] Unify avatar/reward/gamification catalogs into one source of truth
- [x] Versioned local-storage migration layer, initialized before app render
- [x] Central error-reporting service wired to ErrorBoundary
- [x] Resolve stale-closure lint warnings in touched files

## Phase 2 — Daily Mission path `[x]`
- [x] Adaptive 10–15 minute daily mission: review → lesson → game → reward
- [x] Mission service with streak/mastery-driven selection
- [x] `/mission` page and home navigation entry
- [x] Mission completion feeds gamification and progress services

## Phase 3 — Parent dashboard `[x]`
- [x] Weekly activity, mastery by skill, streaks, time-on-task
- [x] "What Makenna learned this week" summary
- [x] Screen-time limits, safe mode, content toggles
- [x] Printable/exportable progress report

## Phase 4 — Teacher / classroom mode `[x]`
- [x] Class roster and child linking
- [x] Assignments and curriculum-aligned lesson plans
- [x] Class progress view
- [x] Printable certificates and worksheets

## Phase 5 — Offline-first sync `[x]`
- [x] Sync queue with deterministic conflict resolution
- [x] Visible sync status and "Sync now" control
- [x] Supabase Row Level Security guidance/migration updates
- [x] Offline export/import for schools

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
