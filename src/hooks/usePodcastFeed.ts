import { useCallback, useEffect, useRef } from 'react';
import { useFeedStore } from '../store/feedStore';
import { usePreferenceStore } from '../store/preferenceStore';
import { parsePodcastFeed } from '../services/rssParser';
import { rankEpisodes } from '../services/feedAlgorithm';
import { SEED_PODCASTS, getPodcastsByCategory } from '../services/seedCatalog';
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

      // Collect all episodes as feeds resolve, re-rank and append incrementally
      const allEpisodes: Episode[] = [];
      let resolved = 0;

      const promises = podcasts.map(p =>
        parsePodcastFeed(p)
          .then(episodes => {
            allEpisodes.push(...episodes);
            resolved++;

            // After first 2 feeds resolve, show something immediately
            if (resolved === 2 || resolved === podcasts.length) {
              const ranked = rankEpisodes([...allEpisodes], prefs, feed.seenIds);
              feed.appendEpisodes(ranked);
            }
          })
          .catch(() => {
            // silently skip failed feeds
          })
      );

      await Promise.allSettled(promises);

      // Final rank pass with everything
      if (resolved > 2) {
        const ranked = rankEpisodes([...allEpisodes], prefs, feed.seenIds);
        feed.appendEpisodes(ranked);
      }

      feed.setLoading(false);
      loadingRef.current = false;
    },
    [feed, prefs]
  );

  const initFeed = useCallback(async () => {
    const { selectedCategories, onboardingComplete } = prefs;

    let podcastsToLoad: Podcast[];

    if (onboardingComplete && selectedCategories.length > 0) {
      const fromPrefs = selectedCategories.flatMap(cat => getPodcastsByCategory(cat));
      const seen = new Set<string>();
      podcastsToLoad = fromPrefs.filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
    } else {
      podcastsToLoad = SEED_PODCASTS.slice(0, 8);
    }

    const subscribed = feed.subscribedPodcasts;
    for (const p of subscribed) {
      if (!podcastsToLoad.find(existing => existing.id === p.id)) {
        podcastsToLoad = [...podcastsToLoad, p];
      }
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
