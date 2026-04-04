import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EngagementEvent, UserPreferences } from '../types/podcast';

const STORAGE_KEY = 'stitch_preferences';
const MAX_SEEN_IDS = 500;

const SCORE_WEIGHTS = {
  play_start: 0.1,
  skip_early: -0.5,
  complete: 1.0,
  like: 1.5,
  share: 1.2,
};

interface PreferenceState extends UserPreferences {
  seenEpisodeIds: string[]; // persisted, capped at MAX_SEEN_IDS
  recordEvent: (event: Omit<EngagementEvent, 'timestamp'>) => void;
  toggleLike: (episodeId: string) => void;
  completeOnboarding: (categories: string[]) => void;
  isLiked: (episodeId: string) => boolean;
  markEpisodeSeen: (episodeId: string) => void;
  getSeenSet: () => Set<string>;
}

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set, get) => ({
      categoryScores: {},
      podcastScores: {},
      likedEpisodeIds: new Set<string>(),
      seenEpisodeIds: [],
      events: [],
      onboardingComplete: false,
      selectedCategories: [],

      markEpisodeSeen: (episodeId) => {
        const { seenEpisodeIds } = get();
        if (seenEpisodeIds.includes(episodeId)) return;
        // Keep newest MAX_SEEN_IDS — drop oldest from the front
        const updated = [...seenEpisodeIds, episodeId];
        set({ seenEpisodeIds: updated.slice(-MAX_SEEN_IDS) });
      },

      getSeenSet: () => new Set(get().seenEpisodeIds),

      recordEvent: (event) => {
        const state = get();
        const fullEvent: EngagementEvent = { ...event, timestamp: Date.now() };

        const baseScore = SCORE_WEIGHTS[event.type] ?? 0;
        const listenBonus =
          event.type === 'skip_early' && event.listenRatio !== undefined
            ? event.listenRatio * 0.3
            : event.type === 'play_start' && event.listenRatio !== undefined
            ? event.listenRatio * 0.5
            : 0;
        const delta = baseScore + listenBonus;

        const newCategoryScores = { ...state.categoryScores };
        for (const cat of event.categories) {
          newCategoryScores[cat] = Math.max(-5, Math.min(10, (newCategoryScores[cat] ?? 0) + delta));
        }

        const newPodcastScores = { ...state.podcastScores };
        newPodcastScores[event.podcastId] = Math.max(
          -5,
          Math.min(10, (newPodcastScores[event.podcastId] ?? 0) + delta)
        );

        set({
          categoryScores: newCategoryScores,
          podcastScores: newPodcastScores,
          events: [...state.events.slice(-200), fullEvent],
        });
      },

      toggleLike: (episodeId) => {
        const state = get();
        const liked = new Set(state.likedEpisodeIds);
        liked.has(episodeId) ? liked.delete(episodeId) : liked.add(episodeId);
        set({ likedEpisodeIds: liked });
      },

      completeOnboarding: (categories) => {
        const scores: Record<string, number> = {};
        for (const cat of categories) scores[cat] = 3;
        set({
          onboardingComplete: true,
          selectedCategories: categories,
          categoryScores: scores,
        });
      },

      isLiked: (episodeId) => get().likedEpisodeIds.has(episodeId),
    }),
    {
      name: STORAGE_KEY,
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          if (parsed?.state?.likedEpisodeIds) {
            parsed.state.likedEpisodeIds = new Set(parsed.state.likedEpisodeIds);
          }
          // Migration: if seenEpisodeIds is missing/empty but events exist,
          // backfill from past engagement history so the fix works immediately
          if (
            (!parsed.state.seenEpisodeIds || parsed.state.seenEpisodeIds.length === 0) &&
            parsed.state.events?.length > 0
          ) {
            const fromHistory = [
              ...new Set<string>(parsed.state.events.map((e: { episodeId: string }) => e.episodeId)),
            ];
            parsed.state.seenEpisodeIds = fromHistory.slice(-MAX_SEEN_IDS);
          }
          return parsed;
        },
        setItem: (name, value) => {
          const toStore = {
            ...value,
            state: {
              ...value.state,
              likedEpisodeIds: Array.from(value.state.likedEpisodeIds),
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
