import { useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import { usePlayerStore } from '../store/playerStore';

let currentHowl: Howl | null = null;

// Pre-load cache: audioUrl → Howl that is already buffering
const preloadCache = new Map<string, Howl>();

export function preloadAudio(audioUrl: string) {
  if (!audioUrl || preloadCache.has(audioUrl)) return;
  const howl = new Howl({
    src: [audioUrl],
    html5: true,
    preload: true,
    volume: 0,
    autoplay: false,
  });
  preloadCache.set(audioUrl, howl);

  // Cap cache size at 4 to avoid memory bloat
  if (preloadCache.size > 4) {
    const oldest = preloadCache.keys().next().value;
    if (oldest) {
      preloadCache.get(oldest)?.unload();
      preloadCache.delete(oldest);
    }
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

  const attachHandlers = useCallback(
    (howl: Howl, autoplay: boolean) => {
      howl.on('load', () => {
        store.setDuration(howl.duration() ?? 0);
        if (autoplay) howl.play();
      });
      howl.on('play', () => {
        store.setStatus('playing');
        progressInterval.current = window.setInterval(() => {
          if (howl.playing()) store.setCurrentTime(howl.seek() as number);
        }, 500);
      });
      howl.on('pause', () => { store.setStatus('paused'); clearProgress(); });
      howl.on('end',   () => { store.setStatus('idle');   clearProgress(); });
      howl.on('stop',  () => { store.setStatus('idle');   clearProgress(); });
      howl.on('loaderror',  () => { store.setStatus('error'); clearProgress(); });
      howl.on('playerror', () => { store.setStatus('error'); clearProgress(); });
    },
    [store, clearProgress]
  );

  const load = useCallback(
    (episodeId: string, audioUrl: string, autoplay = true) => {
      if (currentHowl) {
        currentHowl.unload();
        currentHowl = null;
      }
      clearProgress();

      store.setCurrentEpisodeId(episodeId);
      store.setStatus('loading');

      // Use pre-loaded Howl if available — audio already buffered
      const cached = preloadCache.get(audioUrl);
      if (cached) {
        preloadCache.delete(audioUrl);
        cached.volume(store.volume);
        cached.mute(store.muted);
        currentHowl = cached;
        attachHandlers(cached, autoplay);
        // If it's already loaded, play right away; otherwise wait for onload
        if (cached.state() === 'loaded') {
          store.setDuration(cached.duration());
          if (autoplay) cached.play();
        }
        return;
      }

      currentHowl = new Howl({
        src: [audioUrl],
        html5: true,
        volume: store.volume,
        mute: store.muted,
      });
      attachHandlers(currentHowl, autoplay);
    },
    [store, clearProgress, attachHandlers]
  );

  const play = useCallback(() => { currentHowl?.play(); }, []);
  const pause = useCallback(() => { currentHowl?.pause(); }, []);

  const togglePlay = useCallback(() => {
    if (!currentHowl) return;
    currentHowl.playing() ? currentHowl.pause() : currentHowl.play();
  }, []);

  const seek = useCallback((seconds: number) => {
    if (currentHowl) { currentHowl.seek(seconds); store.setCurrentTime(seconds); }
  }, [store]);

  const setVolume = useCallback((volume: number) => {
    currentHowl?.volume(volume);
    store.setVolume(volume);
  }, [store]);

  const stop = useCallback(() => {
    currentHowl?.stop();
    clearProgress();
  }, [clearProgress]);

  useEffect(() => { currentHowl?.mute(store.muted); }, [store.muted]);

  useEffect(() => {
    return () => {
      clearProgress();
      currentHowl?.unload();
      currentHowl = null;
    };
  }, [clearProgress]);

  return {
    load, play, pause, togglePlay, seek, setVolume, stop,
    status: store.status,
    currentTime: store.currentTime,
    duration: store.duration,
    currentEpisodeId: store.currentEpisodeId,
  };
}
