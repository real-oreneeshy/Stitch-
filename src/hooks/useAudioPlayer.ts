import { useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import { usePlayerStore } from '../store/playerStore';

let currentHowl: Howl | null = null;
let loadGeneration = 0; // incremented on every load(); callbacks check this to abort if stale

// Tracks the most recent playback position so we can restore it after
// an iOS audio-session interruption (background → foreground).
let lastKnownPosition = 0;

const preloadCache = new Map<string, Howl>();

export function preloadAudio(audioUrl: string) {
  if (!audioUrl || preloadCache.has(audioUrl)) return;
  const howl = new Howl({ src: [audioUrl], html5: true, preload: true, volume: 0, autoplay: false });
  preloadCache.set(audioUrl, howl);
  // Keep cache small — more than 2 preloads risks extra <audio> elements
  // interfering with the iOS audio session on background/foreground.
  if (preloadCache.size > 2) {
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
      lastKnownPosition = 0;

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

      howl.on('play', () => {
        if (isStale()) { howl.stop(); return; } // stale — kill it immediately
        store.setStatus('playing');
        clearProgress();
        progressInterval.current = window.setInterval(() => {
          if (howl.playing()) {
            const pos = howl.seek() as number;
            store.setCurrentTime(pos);
            lastKnownPosition = pos; // keep updated for iOS resume
          }
        }, 500);
      });

      howl.on('pause', () => { if (!isStale()) { store.setStatus('paused'); clearProgress(); } });
      howl.on('end',   () => { if (!isStale()) { store.setStatus('idle');   clearProgress(); } });
      // Note: 'stop' fired by our own visibilitychange handler should NOT set status to idle,
      // so we check isStale but also guard against our own internal stop-then-play cycle.
      howl.on('stop',  () => { if (!isStale()) { store.setStatus('idle');   clearProgress(); } });
      howl.on('loaderror',  () => { if (!isStale()) { store.setStatus('error'); clearProgress(); } });
      howl.on('playerror', () => {
        if (isStale()) return;
        store.setStatus('error');
        clearProgress();
      });

      if (cached && howl.state() === 'loaded') {
        // Already buffered — play immediately without waiting for 'load'
        if (!isStale()) {
          store.setDuration(howl.duration() ?? 0);
          if (autoplay) howl.play();
        }
      } else {
        howl.once('load', () => {
          if (isStale()) return;
          store.setDuration(howl.duration() ?? 0);
          if (autoplay) howl.play();
        });
      }
    },
    [store, clearProgress]
  );

  // iOS background → foreground fix:
  // When an iOS audio session is interrupted (switching apps, phone call, etc.)
  // and then resumed, Howler can create duplicate _Sound instances for the same
  // Howl, causing the same episode to play from multiple positions simultaneously.
  // Fix: on foreground return, collapse any duplicate instances via stop() + play()
  // then seek back to the last tracked position.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden || !currentHowl) return;

      // Only act if we expect audio to be playing
      if (store.status !== 'playing') return;

      const position = lastKnownPosition;

      // stop() kills ALL _Sound instances in the Howl (the duplicates too)
      currentHowl.stop();

      // play() creates exactly one clean new instance
      currentHowl.play();

      // Seek to last known position once Howler has set up the new sound
      setTimeout(() => {
        if (currentHowl && store.status !== 'idle') {
          currentHowl.seek(position);
        }
      }, 80);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [store.status]);

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
