import { useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import { usePlayerStore } from '../store/playerStore';

let currentHowl: Howl | null = null;

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
      // Stop existing
      if (currentHowl) {
        currentHowl.unload();
        currentHowl = null;
      }
      clearProgress();

      store.setCurrentEpisodeId(episodeId);
      store.setStatus('loading');

      currentHowl = new Howl({
        src: [audioUrl],
        html5: true,
        volume: store.volume,
        mute: store.muted,
        onload: () => {
          store.setDuration(currentHowl?.duration() ?? 0);
          if (autoplay) {
            currentHowl?.play();
          }
        },
        onplay: () => {
          store.setStatus('playing');
          progressInterval.current = window.setInterval(() => {
            if (currentHowl?.playing()) {
              store.setCurrentTime(currentHowl.seek() as number);
            }
          }, 500);
        },
        onpause: () => {
          store.setStatus('paused');
          clearProgress();
        },
        onend: () => {
          store.setStatus('idle');
          clearProgress();
        },
        onstop: () => {
          store.setStatus('idle');
          clearProgress();
        },
        onloaderror: () => {
          store.setStatus('error');
          clearProgress();
        },
        onplayerror: () => {
          store.setStatus('error');
          clearProgress();
        },
      });
    },
    [store, clearProgress]
  );

  const play = useCallback(() => {
    currentHowl?.play();
  }, []);

  const pause = useCallback(() => {
    currentHowl?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    if (!currentHowl) return;
    if (currentHowl.playing()) {
      currentHowl.pause();
    } else {
      currentHowl.play();
    }
  }, []);

  const seek = useCallback((seconds: number) => {
    if (currentHowl) {
      currentHowl.seek(seconds);
      store.setCurrentTime(seconds);
    }
  }, [store]);

  const setVolume = useCallback(
    (volume: number) => {
      currentHowl?.volume(volume);
      store.setVolume(volume);
    },
    [store]
  );

  const stop = useCallback(() => {
    currentHowl?.stop();
    clearProgress();
  }, [clearProgress]);

  // Sync mute state
  useEffect(() => {
    currentHowl?.mute(store.muted);
  }, [store.muted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearProgress();
      currentHowl?.unload();
      currentHowl = null;
    };
  }, [clearProgress]);

  return {
    load,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    stop,
    status: store.status,
    currentTime: store.currentTime,
    duration: store.duration,
    currentEpisodeId: store.currentEpisodeId,
  };
}
