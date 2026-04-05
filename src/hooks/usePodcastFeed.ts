import { useCallback, useEffect, useRef } from 'react';
import { useFeedStore } from '../store/feedStore';
import { usePreferenceStore } from '../store/preferenceStore';
import { parsePodcastFeed } from '../services/rssParser';
import { rankEpisodes } from '../services/feedAlgorithm';
import { preloadAudio } from './useAudioPlayer';
import { SEED_PODCASTS } from '../services/seedCatalog';
import type { Episode, Podcast } from '../types/podcast';

const FEED_LOAD_THRESHOLD = 5;
// Render the feed once this many distinct podcasts have resolved —
// fast with rss2json since responses are cached JSON (usually < 1s each)
const FIRST_RENDER_MIN_PODCASTS = 5;

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

      const pool: Episode[] = [];
      let firstRenderDone = false;

      const renderFeed = () => {
        if (pool.length === 0) return;
        const ranked = rankEpisodes([...pool], prefs, prefs.getSeenSet());
        feed.replaceUpcoming(ranked);
        const { currentIndex, episodes } = useFeedStore.getState();
        for (let i = 1; i <= 3; i++) {
          const ep = episodes[currentIndex + i];
          if (ep?.audioUrl) preloadAudio(ep.audioUrl);
        }
      };

      await Promise.allSettled(
        podcasts.map(p =>
          parsePodcastFeed(p)
            .then(eps => {
              pool.push(...eps);

              // First render: fire as soon as we have enough diverse podcasts
              if (!firstRenderDone) {
                const podcastsInPool = new Set(pool.map(e => e.podcastId)).size;
                if (podcastsInPool >= FIRST_RENDER_MIN_PODCASTS) {
                  firstRenderDone = true;
                  renderFeed();
                  feed.setLoading(false);
                }
              }
            })
            .catch(() => {})
        )
      );

      // Final pass — updates feed with all resolved episodes
      if (pool.length > 0) {
        renderFeed();
      } else {
        feed.setError('No episodes loaded. Check your connection and retry.');
      }

      feed.setLoading(false);
      loadingRef.current = false;
    },
    [feed, prefs]
  );

  const initFeed = useCallback(async () => {
    const seedPool = [...SEED_PODCASTS];
    const { selectedCategories } = prefs;

    // Sort preferred-category podcasts first so they resolve and render sooner
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
