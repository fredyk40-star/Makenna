# Makenna Project — Dependency Analysis Report
**Generated:** 2026-07-09 | **Tool:** madge (264 files processed)

---

## 1. CIRCULAR DEPENDENCIES ✅

**No circular dependencies found.** All imports form a clean directed acyclic graph. No `A → B → A` cycles to fix.

---

## 2. ORPHAN FILES (Imported by Nothing) — 23 files

These files exist in `src/` but are never imported by any other module. They are candidates for removal or intentional dead code.

### Components (4)
| File | Notes |
|------|-------|
| `components/layout/Notifications.jsx` | Unused notification dropdown/list component |
| `components/layout/ParentZone.jsx` | Unused parent-zone layout component |
| `components/profiles/ProfileSelection.jsx` | Profile picker not wired up |
| `components/stories/StoryLibraryEnhanced.jsx` | Enhanced story library (likely superseded by `StoryLibrary.jsx`) |

### Pages (2)
| File | Notes |
|------|-------|
| `pages/Numbers/games/propTypes.js` | PropType definitions — may be intentional utility |
| `pages/Stories/StoryLibraryPage.jsx` | Alternative stories page not in router |

### Data (1)
| File | Notes |
|------|-------|
| `data/learningData.js` | Learning data file not consumed |

### Hooks (2)
| File | Notes |
|------|-------|
| `hooks/useAssessment.js` | Assessment hook never used |
| `hooks/useGame.js` | Game hook never used |

### Services (10)
| File | Notes |
|------|-------|
| `services/BackupService.js` | Backup functionality — future feature? |
| `services/CollaborationService.js` | Collaboration features not wired |
| `services/CustomThemeService.js` | Custom theme builder — depth 4 chain |
| `services/GamifiedLearningService.js` | Gamified learning — depth 4 chain |
| `services/LearningTimeline.js` | Timeline feature not connected |
| `services/MultiplayerGameService.js` | Multiplayer not implemented |
| `services/SessionTimeoutService.js` | Session timeout not active |
| `services/SyncEngine.js` | Sync engine not wired |
| `services/VirtualFieldTripService.js` | Virtual field trips not connected |
| `services/VoiceCommandService.js` | Voice commands not active |
| `services/storage.js` | Alternative storage module (duplicate of `StorageService.js`?) |

### Utils & PWA (3)
| File | Notes |
|------|-------|
| `pwa/install.js` | PWA install script not imported |
| `utils/PerformanceOptimizer.js` | Perf optimizations never applied |
| `utils/performance.js` | Perf utilities unused |

---

## 3. TOP 15 MOST COUPLED MODULES

These files are imported by the highest number of other modules. Changes here have the widest blast radius.

| Rank | Importers | File |
|------|-----------|------|
| 1 | **40** | `services/StorageService.js` |
| 2 | **36** | `hooks/useAudio.js` |
| 3 | **32** | `utils/accessibility.js` |
| 4 | **21** | `context/ChildAccountContext.jsx` |
| 5 | **21** | `services/ChildAccountService.js` |
| 6 | 13 | `services/GamificationService.js` |
| 7 | 12 | `services/AdaptiveLearningService.js` |
| 8 | 11 | `utils/constants.js` |
| 9 | 10 | `context/ProfileContext.jsx` |
| 10 | 9 | `services/VoiceGuideService.js` |
| 11 | 8 | `context/VoiceGuideContext.jsx` |
| 12 | 8 | `services/GameProgressService.js` |
| 13 | 8 | `data/alphabetData.js` |
| 14 | 8 | `services/ReadingAnalyticsService.js` |
| 15 | 8 | `hooks/useNumbersProgress.js` |

---

## 4. App.jsx COUPLING AUDIT

**App.jsx directly imports 73 modules** — this is the single biggest architectural hotspot:

- **6 contexts** (App, ChildAccount, I18n, Profile, Theme, VoiceGuide)
- **6 global components** (AIAssistant, DataDebug, UpdatePreview, VoiceAssistant, ErrorBoundary, InstallPrompt, LoadingSpinner, OfflineDetector, Layout)
- **57+ pages** directly imported (every page in the app)
- **1 CSS file** (`index.css`)

### Recommendation
Convert `App.jsx` to use **React.lazy() + Suspense** with route-based code splitting:
```jsx
const AlphabetHome = lazy(() => import('./pages/Alphabet/AlphabetHome.jsx'));
const MathsHome = lazy(() => import('./pages/Maths/MathsHome.jsx'));
// ...etc
```
This would:
- Reduce initial bundle size dramatically (~70 page components)
- Eliminate the need for `App.jsx` to statically import every page
- Make the dependency graph cleaner

---

## 5. SERVICE DEPENDENCY CHAINS (Depth ≥ 3)

Services with the deepest import chains. Depth 4 means `A → B → C → D`.

| Depth | Service | Chain |
|-------|---------|-------|
| **4** | `CustomThemeService.js` | → NotificationBellService → RewardsStore → AvatarService → ... |
| **4** | `GamifiedLearningService.js` | → AchievementService + NotificationBellService + RewardsStore → ... |
| **4** | `LessonScheduler.js` | → AdaptiveLearningService → RevisionPlanner → ProfileService → StorageService |
| **4** | `RewardsStore.js` | → AvatarService → GamificationService → StorageService |
| 3 | `AIAssistantService.js` | → AdaptiveLearningService + GamificationService + ProfileService → StorageService |
| 3 | `AchievementService.js` | → GamificationService → StorageService |
| 3 | `BackupService.js` | → AdaptiveLearningService + AnalyticsService + GamificationService → StorageService |
| 3 | `CloudSyncService.js` | → ChildAccountService + StorageService + SupabaseService |

### Key concern
`StorageService.js` is the universal leaf node (40 importers). Any breaking change here affects nearly every service in the app. Consider **interface versioning** or a **facade pattern** to protect against breaking changes.

---

## 6. SUMMARY & RECOMMENDATIONS

| Area | Status | Action |
|------|--------|--------|
| Circular deps | ✅ Clean | Nothing to fix |
| Orphan files | ⚠️ 23 files | Review list — remove dead code or wire up planned features |
| App.jsx coupling | ❌ 73 imports | Implement lazy loading with `React.lazy()` |
| StorageService | ⚠️ 40 importers | Add facade/interface layer before it grows further |
| Service chains | ⚠️ 4 services at depth 4 | Consider flattening `GamifiedLearningService` and `CustomThemeService` |
| Unused services | ⚠️ 11 services | Either integrate or remove to reduce maintenance burden |

### Quick wins
1. **Remove** `services/storage.js` if `StorageService.js` is the canonical one
2. **Remove** `components/stories/StoryLibraryEnhanced.jsx` if `StoryLibrary.jsx` supersedes it
3. **Remove** `pages/Stories/StoryLibraryPage.jsx` if unused in router
4. **Wire or remove** the 11 unused services that appear to be planned-but-not-implemented features