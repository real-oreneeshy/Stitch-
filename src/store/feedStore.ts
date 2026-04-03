import { create } from 'zustand';
import type { Episode, Podcast } from '../types/podcast';

interface FeedState {
  episodes: Episode[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  seenIds: Set<string>;
  subscribedPodcasts: Podcast[];

  setEpisodes: (episodes: Episode[]) => void;
  appendEpisodes: (episodes: Episode[]) => void;
  setCurrentIndex: (index: number) => void;
  nextEpisode: () => void;
  prevEpisode: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  markSeen: (episodeId: string) => void;
  subscribePodcast: (podcast: Podcast) => void;
  unsubscribePodcast: (podcastId: string) => void;
  isSubscribed: (podcastId: string) => boolean;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  episodes: [],
  currentIndex: 0,
  isLoading: false,
  error: null,
  seenIds: new Set(),
  subscribedPodcasts: [],

  setEpisodes: (episodes) => set({ episodes, currentIndex: 0 }),

  appendEpisodes: (episodes) => {
    const existing = new Set(get().episodes.map(e => e.id));
    const fresh = episodes.filter(e => !existing.has(e.id));
    set((s) => ({ episodes: [...s.episodes, ...fresh] }));
  },

  setCurrentIndex: (index) => set({ currentIndex: index }),

  nextEpisode: () => {
    const { currentIndex, episodes } = get();
    if (currentIndex < episodes.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    }
  },

  prevEpisode: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 });
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  markSeen: (episodeId) => {
    const seenIds = new Set(get().seenIds);
    seenIds.add(episodeId);
    set({ seenIds });
  },

  subscribePodcast: (podcast) => {
    const { subscribedPodcasts } = get();
    if (!subscribedPodcasts.find(p => p.id === podcast.id)) {
      set({ subscribedPodcasts: [...subscribedPodcasts, podcast] });
    }
  },

  unsubscribePodcast: (podcastId) => {
    set((s) => ({
      subscribedPodcasts: s.subscribedPodcasts.filter(p => p.id !== podcastId),
    }));
  },

  isSubscribed: (podcastId) =>
    get().subscribedPodcasts.some(p => p.id === podcastId),
}));
