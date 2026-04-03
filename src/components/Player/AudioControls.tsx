import { Play, Pause, Volume2, VolumeX, SkipForward } from 'lucide-react';
import type { PlayerStatus } from '../../store/playerStore';

interface AudioControlsProps {
  status: PlayerStatus;
  muted: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onSkipForward: () => void;
}

export function AudioControls({
  status,
  muted,
  onTogglePlay,
  onToggleMute,
  onSkipForward,
}: AudioControlsProps) {
  const isPlaying = status === 'playing';
  const isLoading = status === 'loading';

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onToggleMute}
        className="text-white/70 hover:text-white transition-colors p-2"
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      <button
        onClick={onTogglePlay}
        className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause size={20} className="text-white" />
        ) : (
          <Play size={20} className="text-white ml-0.5" />
        )}
      </button>

      <button
        onClick={onSkipForward}
        className="text-white/70 hover:text-white transition-colors p-2"
        aria-label="Skip to next"
      >
        <SkipForward size={20} />
      </button>
    </div>
  );
}
