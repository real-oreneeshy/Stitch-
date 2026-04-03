import { motion } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import type { Podcast } from '../../types/podcast';
import { useFeedStore } from '../../store/feedStore';
import { parsePodcastFeed } from '../../services/rssParser';
import { rankEpisodes } from '../../services/feedAlgorithm';
import { usePreferenceStore } from '../../store/preferenceStore';
import { useState } from 'react';

interface PodcastCardProps {
  podcast: Podcast;
}

export function PodcastCard({ podcast }: PodcastCardProps) {
  const feed = useFeedStore();
  const prefs = usePreferenceStore();
  const isSubscribed = feed.isSubscribed(podcast.id);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (isSubscribed || loading) return;
    setLoading(true);
    try {
      feed.subscribePodcast(podcast);
      const episodes = await parsePodcastFeed(podcast);
      const ranked = rankEpisodes(episodes, prefs, feed.seenIds);
      feed.appendEpisodes(ranked);
    } catch {
      // silently ignore — user can retry
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 py-3"
    >
      <img
        src={podcast.imageUrl}
        alt={podcast.title}
        className="w-14 h-14 rounded-xl object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold text-sm truncate">{podcast.title}</h3>
        <p className="text-white/50 text-xs truncate">{podcast.author}</p>
        {podcast.categories[0] && (
          <span className="text-xs text-white/40">{podcast.categories[0]}</span>
        )}
      </div>
      <button
        onClick={handleSubscribe}
        disabled={isSubscribed || loading}
        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
          isSubscribed
            ? 'bg-white/20 text-white'
            : 'bg-white text-black hover:bg-white/90'
        }`}
        aria-label={isSubscribed ? 'Subscribed' : 'Subscribe'}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
        ) : isSubscribed ? (
          <Check size={16} />
        ) : (
          <Plus size={16} />
        )}
      </button>
    </motion.div>
  );
}
