import { Heart } from 'lucide-react';
import { useFeedStore } from '../../store/feedStore';
import { usePreferenceStore } from '../../store/preferenceStore';

export function LikesScreen() {
  const feed = useFeedStore();
  const prefs = usePreferenceStore();

  const likedEpisodes = feed.episodes.filter(ep =>
    prefs.likedEpisodeIds.has(ep.id)
  );

  return (
    <div className="h-full bg-black flex flex-col">
      <div className="px-4 pt-12 pb-4 shrink-0">
        <h1 className="text-white text-2xl font-bold">Liked Episodes</h1>
        <p className="text-white/40 text-sm mt-1">
          {likedEpisodes.length} episode{likedEpisodes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {likedEpisodes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30 gap-3">
          <Heart size={48} strokeWidth={1} />
          <p className="text-sm">Episodes you like will appear here</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 divide-y divide-white/5">
          {likedEpisodes.map(ep => (
            <div key={ep.id} className="flex items-center gap-3 py-3">
              <img
                src={ep.imageUrl || ep.podcastImageUrl}
                alt={ep.title}
                className="w-14 h-14 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm truncate">{ep.title}</h3>
                <p className="text-white/50 text-xs truncate">{ep.podcastTitle}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
