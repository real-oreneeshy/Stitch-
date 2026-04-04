import { useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import { usePlayerStore } from '../store/playerStore';

let currentHowl: Howl | null = null;
let loadGeneration = 0; // incremented on every load(); callbacks check this to abort if stale

const preloadCache = new Map<string, Howl>();

export function preloadAudio(audioUrl: string) {
  if (!audioUrl || preloadCache.has(audioUrl)) return;
  const howl = new Howl({ src: [audioUrl], html5: true, preload: true, volume: 0, autoplay: false });
  preloadCache.set(audioUrl, howl);
  if (preloadCache.size > 4) {
    const oldest = preloadCache.keys().next().value;
    if (oldest) { preloadCache.get(oldest)?.unload(); preloadCache.delete(oldest); }
  }
}

export function useAudioPlayer() {
  const store = usePlayerStore();
  const progressInterval = useRef<number | null>(null);

  const clearProgress = useCallback(() => {
    if (progressInterval.current !== null) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }, []);

  const load = useCallback(
    (episodeId: string, audioUrl: string, autoplay = true) => {
      // Stop and discard whatever was playing
      if (currentHowl) { currentHowl.unload(); currentHowl = null; }
      clearProgress();

      // Stamp this load; any callback from an older load will bail out
      const gen = ++loadGeneration;
      const isStale = () => gen !== loadGeneration;

      store.setCurrentEpisodeId(episodeId);
      store.setStatus('loading');

      const cached = preloadCache.get(audioUrl);
      if (cached) preloadCache.delete(audioUrl);

      const howl = cached ?? new Howl({ src: [audioUrl], html5: true, volume: store.volume, mute: store.muted });
      currentHowl = howl;

      if (cached) { howl.volume(store.volume); howl.mute(store.muted); }

      // Use once() so load event never fires twice
      howl.once('load', () => {
        if (isStale()) return;
        store.setDuration(howl.duration() ?? 0);
        if (autoplay) howl.play();
      });

      howl.on('play', () => {
        if (isStale()) { howl.stop(); return; } // stale — kill it immediately
        store.setStatus('playing');
        clearProgress();
        progressInterval.current = window.setInterval(() => {
          if (howl.playing()) store.setCurrentTime(howl.seek() as number);
        }, 500);
      });

      howl.on('pause', () => { if (!isStale()) { store.setStatus('paused'); clearProgress(); } });
      howl.on('end',   () => { if (!isStale()) { store.setStatus('idle');   clearProgress(); } });
      howl.on('stop',  () => { if (!isStale()) { store.setStatus('idle');   clearProgress(); } });
      howl.on('loaderror',  () => { if (!isStale()) { store.setStatus('error'); clearProgress(); } });
      howl.on('playerror', () => {
        if (isStale()) return;
        store.setStatus('error');
        clearProgress();
      });

      // If pre-loaded and already ready, play immediately without waiting for 'load'
      if (cached && howl.state() === 'loaded') {
        if (!isStale()) {
          store.setDuration(howl.duration() ?? 0);
          if (autoplay) howl.play();
        }
      }
    },
    [store, clearProgress]
  );

  const togglePlay = useCallback(() => {
    if (!currentHowl) return;
    currentHowl.playing() ? currentHowl.pause() : currentHowl.play();
  }, []);

  const seek = useCallback((seconds: number) => {
    if (currentHowl) { currentHowl.seek(seconds); store.setCurrentTime(seconds); }
  }, [store]);

  const setVolume = useCallback((volume: number) => {
    currentHowl?.volume(volume); store.setVolume(volume);
  }, [store]);

  const stop = useCallback(() => { currentHowl?.stop(); clearProgress(); }, [clearProgress]);

  useEffect(() => { currentHowl?.mute(store.muted); }, [store.muted]);

  useEffect(() => {
    return () => { clearProgress(); currentHowl?.unload(); currentHowl = null; };
  }, [clearProgress]);

  return {
    load, togglePlay, seek, setVolume, stop,
    status: store.status,
    currentTime: store.currentTime,
    duration: store.duration,
    currentEpisodeId: store.currentEpisodeId,
  };
}
