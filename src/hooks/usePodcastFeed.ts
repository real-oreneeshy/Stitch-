import { useCallback, useEffect, useRef } from 'react';
import { useFeedStore } from '../store/feedStore';
import { usePreferenceStore } from '../store/preferenceStore';
import { parsePodcastFeed } from '../services/rssParser';
import { rankEpisodes } from '../services/feedAlgorithm';
import { SEED_PODCASTS, getPodcastsByCategory } from '../services/seedCatalog';
import type { Podcast } from '../types/podcast';

const FEED_LOAD_THRESHOLD = 5; // load more when within 5 episodes of end

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

      try {
        const results = await Promise.allSettled(
          podcasts.map(p => parsePodcastFeed(p))
        );

        const allEpisodes = results
          .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof parsePodcastFeed>>> => r.status === 'fulfilled')
          .flatMap(r => r.value);

        const ranked = rankEpisodes(allEpisodes, prefs, feed.seenIds);
        feed.appendEpisodes(ranked);
      } catch (err) {
        feed.setError('Failed to load episodes. Please try again.');
      } finally {
        feed.setLoading(false);
        loadingRef.current = false;
      }
    },
    [feed, prefs]
  );

  // Initial load based on user preferences
  const initFeed = useCallback(async () => {
    const { selectedCategories, onboardingComplete } = prefs;

    let podcastsToLoad: Podcast[];

    if (onboardingComplete && selectedCategories.length > 0) {
      // Load from preferred categories
      const fromPrefs = selectedCategories.flatMap(cat => getPodcastsByCategory(cat));
      // Deduplicate
      const seen = new Set<string>();
      podcastsToLoad = fromPrefs.filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
    } else {
      // Cold start — use a diverse sample
      podcastsToLoad = SEED_PODCASTS.slice(0, 8);
    }

    // Include subscribed podcasts
    const subscribed = feed.subscribedPodcasts;
    for (const p of subscribed) {
      if (!podcastsToLoad.find(existing => existing.id === p.id)) {
        podcastsToLoad = [...podcastsToLoad, p];
      }
    }

    await loadFromPodcasts(podcastsToLoad);
  }, [prefs, feed.subscribedPodcasts, loadFromPodcasts]);

  // Load more when approaching end
  const maybeLoadMore = useCallback(async () => {
    const { episodes, currentIndex, isLoading } = feed;
    const remaining = episodes.length - currentIndex;
    if (remaining <= FEED_LOAD_THRESHOLD && !isLoading) {
      await initFeed();
    }
  }, [feed, initFeed]);

  // Watch current index for infinite load
  useEffect(() => {
    maybeLoadMore();
  }, [feed.currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  return { initFeed, loadFromPodcasts, maybeLoadMore };
}
