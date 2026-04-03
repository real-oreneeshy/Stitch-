import { useCallback, useEffect, useRef } from 'react';
import { useFeedStore } from '../store/feedStore';
import { usePreferenceStore } from '../store/preferenceStore';
import { parsePodcastFeed } from '../services/rssParser';
import { rankEpisodes } from '../services/feedAlgorithm';
import { SEED_PODCASTS } from '../services/seedCatalog';
import type { Episode, Podcast } from '../types/podcast';

const FEED_LOAD_THRESHOLD = 5;

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

      const allEpisodes: Episode[] = [];
      let resolved = 0;
      let firstBatchShown = false;

      const promises = podcasts.map(p =>
        parsePodcastFeed(p)
          .then(episodes => {
            allEpisodes.push(...episodes);
            resolved++;

            // Show episodes as soon as the very first feed resolves
            if (!firstBatchShown) {
              firstBatchShown = true;
              const ranked = rankEpisodes([...allEpisodes], prefs, feed.seenIds);
              feed.appendEpisodes(ranked);
            }
          })
          .catch(() => { /* skip failed feeds silently */ })
      );

      await Promise.allSettled(promises);

      // Final pass with all resolved feeds merged + re-ranked
      const ranked = rankEpisodes([...allEpisodes], prefs, feed.seenIds);
      feed.appendEpisodes(ranked);

      feed.setLoading(false);
      loadingRef.current = false;
    },
    [feed, prefs]
  );

  const initFeed = useCallback(async () => {
    // Always start with full seed catalog (20 podcasts) for a rich pool
    const seedPool = [...SEED_PODCASTS];

    // Bump preferred-category podcasts to the front so they resolve first
    const { selectedCategories } = prefs;
    if (selectedCategories.length > 0) {
      seedPool.sort((a, b) => {
        const aMatch = a.categories.some(c => selectedCategories.includes(c)) ? 0 : 1;
        const bMatch = b.categories.some(c => selectedCategories.includes(c)) ? 0 : 1;
        return aMatch - bMatch;
      });
    }

    // Prepend any subscribed podcasts not already in the list
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
