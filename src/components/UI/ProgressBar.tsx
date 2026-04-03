interface ProgressBarProps {
  current: number;
  total: number;
  onSeek?: (ratio: number) => void;
  className?: string;
}

export function ProgressBar({ current, total, onSeek, className = '' }: ProgressBarProps) {
  const ratio = total > 0 ? Math.min(1, current / total) : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    onSeek(x / rect.width);
  };

  return (
    <div
      className={`relative h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <div
        className="h-full bg-white rounded-full transition-all duration-300"
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}
