import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFeedStore } from '../../store/feedStore';
import { usePodcastFeed } from '../../hooks/usePodcastFeed';
import { useSwipeFeed } from '../../hooks/useSwipeFeed';
import { preloadAudio } from '../../hooks/useAudioPlayer';
import { EpisodeCard } from './EpisodeCard';
import { EpisodeCardSkeleton } from '../UI/Skeleton';

export function SwipeableFeed() {
  const feed = useFeedStore();
  const { initFeed } = usePodcastFeed();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initFeed();
    }
  }, [initFeed]);

  const { episodes, currentIndex, isLoading } = feed;
  const currentEpisode = episodes[currentIndex] ?? null;
  const direction = useRef(0);

  // Pre-load audio for next 2 episodes whenever index changes
  useEffect(() => {
    for (let i = 1; i <= 2; i++) {
      const ep = episodes[currentIndex + i];
      if (ep?.audioUrl) preloadAudio(ep.audioUrl);
    }
  }, [currentIndex, episodes]);

  const handleNext = () => { direction.current = -1; feed.nextEpisode(); };
  const handlePrev = () => { direction.current = 1;  feed.prevEpisode(); };

  const { handlers } = useSwipeFeed(handleNext, handlePrev);

  return (
    <div
      className="swipe-container w-full h-full relative outline-none"
      tabIndex={0}
      {...handlers}
    >
      {isLoading && episodes.length === 0 ? (
        <EpisodeCardSkeleton />
      ) : episodes.length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-white/50 gap-4">
          <p className="text-lg">No episodes found</p>
          <button
            onClick={initFeed}
            className="px-6 py-2 rounded-full bg-white/20 text-white text-sm hover:bg-white/30 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          {currentEpisode && (
            <motion.div
              key={currentEpisode.id}
              className="absolute inset-0"
              initial={{ y: direction.current > 0 ? '-100%' : '100%', opacity: 0.7 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: direction.current > 0 ? '100%' : '-100%', opacity: 0.7 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <EpisodeCard
                episode={currentEpisode}
                isActive={true}
                onNext={handleNext}
                onPrev={handlePrev}
                hasPrev={currentIndex > 0}
                hasNext={currentIndex < episodes.length - 1}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {isLoading && episodes.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div className="h-full bg-white/40 animate-pulse rounded-full" />
        </div>
      )}
    </div>
  );
}
