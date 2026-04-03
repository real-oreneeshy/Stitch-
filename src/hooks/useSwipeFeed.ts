import { useRef, useCallback } from 'react';
import { useFeedStore } from '../store/feedStore';

const SWIPE_THRESHOLD = 50; // px
const SWIPE_VELOCITY_THRESHOLD = 0.3; // px/ms

interface TouchState {
  startY: number;
  startTime: number;
  lastY: number;
}

export function useSwipeFeed(onNext?: () => void, onPrev?: () => void) {
  const feed = useFeedStore();
  const touch = useRef<TouchState | null>(null);
  const isSwiping = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touch.current = {
      startY: e.touches[0].clientY,
      startTime: Date.now(),
      lastY: e.touches[0].clientY,
    };
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touch.current) return;
    touch.current.lastY = e.touches[0].clientY;
    const deltaY = touch.current.startY - touch.current.lastY;
    if (Math.abs(deltaY) > 10) {
      isSwiping.current = true;
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touch.current || !isSwiping.current) {
      touch.current = null;
      return;
    }

    const deltaY = touch.current.startY - touch.current.lastY;
    const elapsed = Date.now() - touch.current.startTime;
    const velocity = Math.abs(deltaY) / elapsed;

    const shouldSwipe =
      Math.abs(deltaY) > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD;

    if (shouldSwipe) {
      if (deltaY > 0) {
        // Swiped up → next episode
        feed.nextEpisode();
        onNext?.();
      } else {
        // Swiped down → previous episode
        feed.prevEpisode();
        onPrev?.();
      }
    }

    touch.current = null;
    isSwiping.current = false;
  }, [feed, onNext, onPrev]);

  // Keyboard support
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        feed.nextEpisode();
        onNext?.();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        feed.prevEpisode();
        onPrev?.();
      }
    },
    [feed, onNext, onPrev]
  );

  // Mouse wheel support (desktop)
  const wheelAccum = useRef(0);
  const wheelTimeout = useRef<number | null>(null);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      wheelAccum.current += e.deltaY;

      if (wheelTimeout.current) {
        clearTimeout(wheelTimeout.current);
      }

      wheelTimeout.current = window.setTimeout(() => {
        if (Math.abs(wheelAccum.current) > 50) {
          if (wheelAccum.current > 0) {
            feed.nextEpisode();
            onNext?.();
          } else {
            feed.prevEpisode();
            onPrev?.();
          }
        }
        wheelAccum.current = 0;
      }, 50);
    },
    [feed, onNext, onPrev]
  );

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onKeyDown: handleKeyDown,
      onWheel: handleWheel,
    },
  };
}
