import { create } from 'zustand';

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

interface PlayerState {
  status: PlayerStatus;
  currentEpisodeId: string | null;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  setStatus: (status: PlayerStatus) => void;
  setCurrentEpisodeId: (id: string | null) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  status: 'idle',
  currentEpisodeId: null,
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,

  setStatus: (status) => set({ status }),
  setCurrentEpisodeId: (id) => set({ currentEpisodeId: id, currentTime: 0 }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
}));
