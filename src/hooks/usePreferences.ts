import { useCallback } from 'react';
import { usePreferenceStore } from '../store/preferenceStore';
import type { Episode } from '../types/podcast';

export function usePreferences() {
  const store = usePreferenceStore();

  const onPlayStart = useCallback(
    (episode: Episode) => {
      store.recordEvent({
        episodeId: episode.id,
        podcastId: episode.podcastId,
        categories: episode.categories,
        type: 'play_start',
      });
    },
    [store]
  );

  const onSkip = useCallback(
    (episode: Episode, listenRatio: number) => {
      store.recordEvent({
        episodeId: episode.id,
        podcastId: episode.podcastId,
        categories: episode.categories,
        type: listenRatio < 0.15 ? 'skip_early' : 'play_start',
        listenRatio,
      });
    },
    [store]
  );

  const onComplete = useCallback(
    (episode: Episode) => {
      store.recordEvent({
        episodeId: episode.id,
        podcastId: episode.podcastId,
        categories: episode.categories,
        type: 'complete',
        listenRatio: 1.0,
      });
    },
    [store]
  );

  const onLike = useCallback(
    (episode: Episode) => {
      store.toggleLike(episode.id);
      store.recordEvent({
        episodeId: episode.id,
        podcastId: episode.podcastId,
        categories: episode.categories,
        type: 'like',
      });
    },
    [store]
  );

  return {
    onPlayStart,
    onSkip,
    onComplete,
    onLike,
    isLiked: store.isLiked,
    completeOnboarding: store.completeOnboarding,
    onboardingComplete: store.onboardingComplete,
    selectedCategories: store.selectedCategories,
    categoryScores: store.categoryScores,
  };
}
