import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, Info, ChevronUp, ChevronDown, Play, Pause } from 'lucide-react';
import type { Episode } from '../../types/podcast';
import { ProgressBar } from '../UI/ProgressBar';
import { AudioControls } from '../Player/AudioControls';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { usePlayerStore } from '../../store/playerStore';
import { usePreferences } from '../../hooks/usePreferences';

interface EpisodeCardProps {
  episode: Episode;
  isActive: boolean;
  onNext: () => void;
  onPrev: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDuration(seconds: number): string {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function EpisodeCard({
  episode,
  isActive,
  onNext,
  onPrev: _onPrev,
  hasPrev,
  hasNext,
}: EpisodeCardProps) {
  const player = useAudioPlayer();
  const playerStore = usePlayerStore();
  const prefs = usePreferences();
  const [showInfo, setShowInfo] = useState(false);
  const [showPlayPulse, setShowPlayPulse] = useState(false);
  const playStartTime = useRef<number | null>(null);
  const hasTrackedPlay = useRef(false);

  // Auto-play when card becomes active
  useEffect(() => {
    if (isActive) {
      hasTrackedPlay.current = false;
      playStartTime.current = Date.now();
      player.load(episode.id, episode.audioUrl, true);
      prefs.onPlayStart(episode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, episode.id]);

  // Track skip engagement when navigating away
  useEffect(() => {
    if (!isActive && playStartTime.current && !hasTrackedPlay.current) {
      hasTrackedPlay.current = true;
      const elapsed = (Date.now() - playStartTime.current) / 1000;
      const duration = player.duration || episode.duration || 1;
      const listenRatio = Math.min(1, elapsed / duration);

      if (listenRatio >= 0.8) {
        prefs.onComplete(episode);
      } else {
        prefs.onSkip(episode, listenRatio);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const isCurrentEpisode = playerStore.currentEpisodeId === episode.id;
  const currentTime = isCurrentEpisode ? playerStore.currentTime : 0;
  const duration = isCurrentEpisode ? playerStore.duration : episode.duration;

  const handleSeek = (ratio: number) => {
    player.seek(ratio * duration);
  };

  const liked = prefs.isLiked(episode.id);

  const handleLike = () => {
    prefs.onLike(episode);
  };

  const handleTapCenter = () => {
    player.togglePlay();
    setShowPlayPulse(true);
    setTimeout(() => setShowPlayPulse(false), 600);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: episode.title,
        text: `Check out this episode: ${episode.title} from ${episode.podcastTitle}`,
      });
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Background artwork */}
      <div className="absolute inset-0">
        <img
          src={episode.imageUrl || episode.podcastImageUrl}
          alt={episode.podcastTitle}
          className="w-full h-full object-cover scale-110 blur-2xl opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
      </div>

      {/* Center artwork — tap to play/pause */}
      <div
        className="absolute inset-0 flex items-center justify-center pt-16 pb-48 cursor-pointer"
        onClick={handleTapCenter}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-2xl overflow-hidden shadow-2xl"
        >
          <img
            src={episode.imageUrl || episode.podcastImageUrl}
            alt={episode.title}
            className="w-full h-full object-cover"
          />
          {/* Play/pause pulse overlay */}
          <AnimatePresence>
            {showPlayPulse && (
              <motion.div
                initial={{ opacity: 0.8, scale: 0.6 }}
                animate={{ opacity: 0, scale: 1.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl"
              >
                {playerStore.status === 'playing' ? (
                  <Pause size={56} className="text-white drop-shadow-lg" />
                ) : (
                  <Play size={56} className="text-white drop-shadow-lg" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Right action bar */}
      <div className="absolute right-4 bottom-40 flex flex-col items-center gap-6 z-20">
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1"
          aria-label="Like"
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
              liked ? 'bg-red-500' : 'bg-white/20 backdrop-blur'
            }`}
          >
            <Heart
              size={20}
              className={liked ? 'text-white fill-white' : 'text-white'}
            />
          </div>
          <span className="text-white text-xs font-medium">Like</span>
        </button>

        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1"
          aria-label="Share"
        >
          <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <Share2 size={20} className="text-white" />
          </div>
          <span className="text-white text-xs font-medium">Share</span>
        </button>

        <button
          onClick={() => setShowInfo(v => !v)}
          className="flex flex-col items-center gap-1"
          aria-label="Info"
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
              showInfo ? 'bg-white/40' : 'bg-white/20 backdrop-blur'
            }`}
          >
            <Info size={20} className="text-white" />
          </div>
          <span className="text-white text-xs font-medium">Info</span>
        </button>
      </div>

      {/* Swipe hint arrows */}
      {hasNext && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center opacity-50">
          <ChevronUp size={20} className="text-white animate-bounce" />
        </div>
      )}
      {hasPrev && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center opacity-50 pointer-events-none">
          <ChevronDown size={20} className="text-white" />
        </div>
      )}

      {/* Bottom info panel */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-8 pt-4">
        {/* Podcast name */}
        <div className="flex items-center gap-2 mb-2">
          <img
            src={episode.podcastImageUrl}
            alt={episode.podcastTitle}
            className="w-7 h-7 rounded-full object-cover"
          />
          <span className="text-white/80 text-sm font-medium truncate">
            {episode.podcastTitle}
          </span>
          {episode.categories[0] && (
            <span className="ml-auto text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded-full truncate max-w-[80px]">
              {episode.categories[0]}
            </span>
          )}
        </div>

        {/* Episode title */}
        <h2 className="text-white font-bold text-base leading-snug mb-1 line-clamp-2">
          {episode.title}
        </h2>

        {/* Description (collapsible) */}
        {showInfo && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-white/70 text-xs leading-relaxed mb-3 line-clamp-4"
          >
            {episode.description || 'No description available.'}
          </motion.p>
        )}

        {/* Duration */}
        {duration > 0 && (
          <div className="flex justify-between text-white/50 text-xs mb-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        )}

        {/* Progress bar */}
        <ProgressBar
          current={currentTime}
          total={duration}
          onSeek={handleSeek}
          className="mb-4"
        />

        {/* Controls */}
        <div className="flex items-center justify-between">
          <AudioControls
            status={isCurrentEpisode ? playerStore.status : 'idle'}
            muted={playerStore.muted}
            onTogglePlay={player.togglePlay}
            onToggleMute={playerStore.toggleMute}
            onSkipForward={onNext}
          />
        </div>
      </div>
    </div>
  );
}
