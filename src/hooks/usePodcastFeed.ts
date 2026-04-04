import { useCallback, useEffect, useRef } from 'react';
import { useFeedStore } from '../store/feedStore';
import { usePreferenceStore } from '../store/preferenceStore';
import { parsePodcastFeed } from '../services/rssParser';
import { rankEpisodes } from '../services/feedAlgorithm';
import { preloadAudio } from './useAudioPlayer';
import { SEED_PODCASTS } from '../services/seedCatalog';
import type { Episode, Podcast } from '../types/podcast';

const FEED_LOAD_THRESHOLD = 5;
// Any feed slower than this is skipped for the visible pool (still resolves eventually)
const PER_FEED_TIMEOUT_MS = 7000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export function usePodcastFeed() {
  const feed = useFeedStore();
  const prefs = usePreferenceStore();
  const loadingRef = useRef(false);

  const loadFromPodcasts = useCallback(
    async (podcasts: Podcast[]) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      feed.setLoading(true);
      feed.setError(null);

      // Accumulated pool — grows as each feed resolves
      const pool: Episode[] = [];

      // Fire ALL feeds simultaneously; update the visible queue on EVERY resolve.
      // replaceUpcoming re-interleaves everything ahead of the current card,
      // so diversity improves progressively without ever clustering.
      await Promise.allSettled(
        podcasts.map(p =>
          withTimeout(parsePodcastFeed(p), PER_FEED_TIMEOUT_MS)
            .then(eps => {
              pool.push(...eps);
              // Use persisted seenIds so episodes don't repeat across sessions
              const ranked = rankEpisodes([...pool], prefs, prefs.getSeenSet());
              feed.replaceUpcoming(ranked);
              // Pre-warm audio for the next 3 upcoming episodes after each pool update
              const { currentIndex, episodes } = useFeedStore.getState();
              for (let i = 1; i <= 3; i++) {
                const ep = episodes[currentIndex + i];
                if (ep?.audioUrl) preloadAudio(ep.audioUrl);
              }
            })
            .catch(() => {}) // timeout or parse error — silently skip
        )
      );

      feed.setLoading(false);
      loadingRef.current = false;
    },
    [feed, prefs]
  );

  const initFeed = useCallback(async () => {
    const seedPool = [...SEED_PODCASTS];
    const { selectedCategories } = prefs;

    // Preferred-category podcasts sort first so they tend to resolve earlier
    if (selectedCategories.length > 0) {
      seedPool.sort((a, b) => {
        const aMatch = a.categories.some(c => selectedCategories.includes(c)) ? 0 : 1;
        const bMatch = b.categories.some(c => selectedCategories.includes(c)) ? 0 : 1;
        return aMatch - bMatch;
      });
    }

    const podcastsToLoad: Podcast[] = [];
    const seen = new Set<string>();
    for (const p of [...feed.subscribedPodcasts, ...seedPool]) {
      if (!seen.has(p.id)) { seen.add(p.id); podcastsToLoad.push(p); }
    }

    await loadFromPodcasts(podcastsToLoad);
  }, [prefs, feed.subscribedPodcasts, loadFromPodcasts]);

  const maybeLoadMore = useCallback(async () => {
    const { episodes, currentIndex, isLoading } = feed;
    const remaining = episodes.length - currentIndex;
    if (remaining <= FEED_LOAD_THRESHOLD && !isLoading) {
      await initFeed();
    }
  }, [feed, initFeed]);

  useEffect(() => {
    maybeLoadMore();
  }, [feed.currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  return { initFeed, loadFromPodcasts, maybeLoadMore };
}
