# Stitch — TikTok-style Podcast Discovery App

## Quick Start
```bash
npm run dev     # local dev server (Vite)
npm run build   # tsc + vite build → dist/
```
Deployed to GitHub Pages via `.github/workflows/deploy.yml` on push.

## Repo & Branch
- **Repo**: `real-oreneeshy/Stitch-` (public, GitHub Pages enabled via Actions)
- **Dev branch**: `claude/podcast-discovery-app-2asV0`

## Stack
- React 19 + TypeScript + Vite 8
- Tailwind CSS v4 (PostCSS)
- Framer Motion — swipe animations, card transitions
- Zustand 5 — state management (feedStore, playerStore, preferenceStore)
- Howler.js 2.2 — cross-browser audio (HTML5 mode, preload cache)
- iTunes Lookup API — episode data (no backend, no CORS proxy, no API key)

## Architecture

### Data flow
```
iTunes Lookup API  →  rssParser.ts (JSON→Episode[])
                           ↓
                    feedAlgorithm.ts (rank + interleave + enforce non-consecutive)
                           ↓
                    feedStore (Zustand) — episodes[], currentIndex
                           ↓
                    SwipeableFeed → EpisodeCard (auto-play on isActive)
                           ↓
                    useAudioPlayer (Howler.js with preload cache + generation counter)
```

### File Map

```
src/
├── services/
│   ├── rssParser.ts        — iTunes Lookup API client. Returns Episode[] per podcast.
│   ├── feedAlgorithm.ts    — rankEpisodes(): preference scoring, recency decay,
│   │                         round-robin interleave, enforceNonConsecutive hard pass.
│   ├── seedCatalog.ts      — 20 curated podcasts with REAL iTunes IDs. ALL_CATEGORIES.
│   ├── corsProxy.ts        — DEAD CODE. Old CORS proxy race (allorigins/corsproxy/cors.sh).
│   │                         Kept as fallback reference; nothing imports it.
│   └── itunesSearch.ts     — iTunes Search API for discover/search screen.
│
├── hooks/
│   ├── useAudioPlayer.ts   — Howler.js wrapper. Module-level currentHowl + loadGeneration
│   │                         counter prevents stale callbacks. preloadCache (Map<url,Howl>).
│   │                         visibilitychange handler fixes iOS background duplicate playback.
│   ├── usePodcastFeed.ts   — Fetches all seed podcasts via parsePodcastFeed(), ranks,
│   │                         renders feed progressively (first render at 5 distinct podcasts).
│   ├── usePreferences.ts   — Convenience wrapper around preferenceStore actions.
│   └── useSwipeFeed.ts     — Touch/keyboard swipe detection for feed navigation.
│
├── store/
│   ├── feedStore.ts        — episodes[], currentIndex, replaceUpcoming(), promoteEpisode().
│   ├── playerStore.ts      — status, currentTime, duration, volume, muted.
│   └── preferenceStore.ts  — Persisted (localStorage). categoryScores, podcastScores,
│                             seenEpisodeIds (capped 500), events[], engagement tracking.
│
├── components/
│   ├── Feed/
│   │   ├── SwipeableFeed.tsx   — AnimatePresence + motion cards. Preloads current+2 ahead.
│   │   └── EpisodeCard.tsx     — Auto-play on isActive. Buffering spinner. Like/share/info.
│   │                             Tracks engagement: complete→promoteEpisode, skip→penalise.
│   ├── Discover/
│   │   ├── DiscoverScreen.tsx  — Browse categories, search, "Reset taste" button.
│   │   ├── SearchBar.tsx       — iTunes Search API integration.
│   │   ├── PodcastCard.tsx     — Card for discover results.
│   │   └── LikesScreen.tsx     — Liked episodes view.
│   ├── Onboarding/
│   │   └── CategorySelector.tsx — First-run category picker.
│   ├── Player/
│   │   └── AudioControls.tsx   — Play/pause, mute, skip forward.
│   └── UI/
│       ├── BottomNav.tsx       — Tab navigation.
│       ├── ProgressBar.tsx     — Seekable progress bar.
│       ├── Skeleton.tsx        — Loading placeholder.
│       └── ErrorBoundary.tsx   — React error boundary.
│
└── types/
    └── podcast.ts          — Episode, Podcast, UserPreferences, EngagementEvent types.
```

## Key Design Decisions

1. **iTunes Lookup API over RSS+CORS proxies**: Direct `itunes.apple.com/lookup?id=X&entity=podcastEpisode` calls. CORS-enabled natively, no proxy, no API key, Apple CDN speeds. Previous approaches (allorigins/corsproxy/rss2json) all failed due to latency or auth requirements.

2. **Real iTunes IDs in seedCatalog**: The `id` field on each Podcast is the actual Apple iTunes podcast ID. Needed for the iTunes Lookup API. Verify at: `https://itunes.apple.com/lookup?id=<ID>&entity=podcastEpisode&limit=1`

3. **Stable episode IDs**: `{podcastId}::{trackId}` from iTunes. Used for seenEpisodeIds persistence across sessions.

4. **Feed diversity**: Round-robin `interleaveByPodcast()` + `enforceNonConsecutive()` hard pass ensures no two consecutive episodes from the same podcast.

5. **Preference engine**: Engagement events update `categoryScores` and `podcastScores`. Full listen (+1.0), like (+1.5), early skip (-0.5 + listen ratio bonus). `promoteEpisode()` brings another ep from the same podcast forward after a complete listen.

6. **Audio preload cache**: Howler.js `preloadAudio()` buffers the current + next 2 episodes. Cache capped at 3. iOS `visibilitychange` handler stops+replays to prevent duplicate `_Sound` instances after background/foreground.

7. **Generation counter**: `loadGeneration` in useAudioPlayer prevents stale Howl callbacks from old episodes. Every `load()` call increments the counter; callbacks check `isStale()` and bail if outdated.

8. **Seen episodes**: `seenEpisodeIds` (string[], persisted, capped at 500) in preferenceStore. Marked immediately on card activation. `rankEpisodes` filters them out.

## Current Status

### Working
- Diverse, randomised feed from 20 seed podcasts
- TikTok-style swipe UX with auto-play
- Audio preloading (current + next 2)
- Buffering indicator (spinner + "Buffering…" text)
- iOS background/foreground audio fix (visibilitychange stop/play/seek cycle)
- Preference tracking and seen-episode persistence
- GitHub Pages deployment via Actions
- No consecutive same-podcast episodes (enforceNonConsecutive)

### Current Focus — Audio Latency
Instant playback is critical for engagement. Most episodes play instantly thanks to
preloading, but some podcasts (Hardcore History, Darknet Diaries, Masters of Scale)
have slow audio servers causing 5-30s buffering on first play.

**Agreed approach (not yet implemented):** Only surface episodes in the feed once
their audio is cached. Slow episodes preload in the background and appear in the
feed when ready. This means:
- Track which audio URLs have finished preloading (Howl `load` event → "ready" set)
- Feed ranking gives a large score boost to ready episodes so they float to the top
- Episodes from slow servers still appear — just later, once buffered
- The user never sees a buffering spinner; every swipe is instant

Implementation touches: `useAudioPlayer.ts` (export ready-tracking), `feedAlgorithm.ts`
(ready bonus in scoring), `usePodcastFeed.ts` (broader preloading + periodic re-rank).

### Roadmap (priority order)
1. **Audio latency** — implement ready-first feed (see above)
2. **UI upgrade** — card design, swipe feel, animations, polish
3. **Catalog expansion** — more podcasts, iTunes Search for dynamic discovery
4. **Preference refinement** — better engagement signals, category tuning

### Cleanup
- `corsProxy.ts` is dead code — nothing imports it, safe to delete
