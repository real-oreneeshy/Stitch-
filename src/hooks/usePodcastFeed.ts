import { useCallback, useEffect, useRef } from 'react';
import { useFeedStore } from '../store/feedStore';
import { usePreferenceStore } from '../store/preferenceStore';
import { parsePodcastFeed } from '../services/rssParser';
import { rankEpisodes } from '../services/feedAlgorithm';
import { SEED_PODCASTS } from '../services/seedCatalog';
import type { Episode, Podcast } from '../types/podcast';

const FEED_LOAD_THRESHOLD = 5;
// How many feeds to fetch before showing the first episode
const PHASE1_COUNT = 3;

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

      // Phase 1: fetch first PHASE1_COUNT feeds, wait for ALL of them
      // This guarantees diversity (3 different podcasts) before showing anything
      const phase1 = podcasts.slice(0, PHASE1_COUNT);
      const phase2 = podcasts.slice(PHASE1_COUNT);

      const phase1Episodes: Episode[] = [];
      await Promise.allSettled(
        phase1.map(p =>
          parsePodcastFeed(p)
            .then(eps => phase1Episodes.push(...eps))
            .catch(() => {})
        )
      );

      if (phase1Episodes.length > 0) {
        const ranked = rankEpisodes([...phase1Episodes], prefs, feed.seenIds);
        feed.appendEpisodes(ranked);
      }

      // Phase 2: load remaining feeds in background, re-rank and append as they resolve
      if (phase2.length > 0) {
        const allEpisodes = [...phase1Episodes];
        Promise.allSettled(
          phase2.map(p =>
            parsePodcastFeed(p)
              .then(eps => {
                allEpisodes.push(...eps);
                // Re-rank everything each time a feed comes in and append new ones
                const ranked = rankEpisodes([...allEpisodes], prefs, feed.seenIds);
                feed.appendEpisodes(ranked);
              })
              .catch(() => {})
          )
        ).finally(() => {
          feed.setLoading(false);
          loadingRef.current = false;
        });
      } else {
        feed.setLoading(false);
        loadingRef.current = false;
      }
    },
    [feed, prefs]
  );

  const initFeed = useCallback(async () => {
    const seedPool = [...SEED_PODCASTS];
    const { selectedCategories } = prefs;

    // Sort: preferred categories first, then discovery
    if (selectedCategories.length > 0) {
      seedPool.sort((a, b) => {
        const aMatch = a.categories.some(c => selectedCategories.includes(c)) ? 0 : 1;
        const bMatch = b.categories.some(c => selectedCategories.includes(c)) ? 0 : 1;
        return aMatch - bMatch;
      });
    }

    // Subscribed podcasts go to front
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
