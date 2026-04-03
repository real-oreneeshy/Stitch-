import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { PodcastCard } from './PodcastCard';
import { searchPodcasts } from '../../services/itunesSearch';
import { SEED_PODCASTS, ALL_CATEGORIES } from '../../services/seedCatalog';
import { usePreferenceStore } from '../../store/preferenceStore';
import { useFeedStore } from '../../store/feedStore';
import type { Podcast } from '../../types/podcast';

export function DiscoverScreen() {
  const [results, setResults] = useState<Podcast[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const prefStore = usePreferenceStore();
  const feedStore = useFeedStore();

  const handleResetOnboarding = () => {
    prefStore.completeOnboarding([]);          // clear categories
    // Reach into store internals to wipe onboarding flag
    usePreferenceStore.setState({
      onboardingComplete: false,
      selectedCategories: [],
      categoryScores: {},
      podcastScores: {},
      likedEpisodeIds: new Set(),
      events: [],
    });
    feedStore.setEpisodes([]);
  };

  const featuredByCategory = activeCategory
    ? SEED_PODCASTS.filter(p => p.categories.includes(activeCategory))
    : SEED_PODCASTS;

  const handleSearch = async (query: string) => {
    if (!query) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    setError(null);
    try {
      const found = await searchPodcasts(query, 20);
      setResults(found);
    } catch {
      setError('Search failed. Check your connection.');
    } finally {
      setIsSearching(false);
    }
  };

  const displayPodcasts = results.length > 0 ? results : featuredByCategory;

  return (
    <div className="h-full bg-black flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-2xl font-bold">Discover</h1>
          <button
            onClick={handleResetOnboarding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/60 text-xs hover:bg-white/20 transition-colors"
          >
            <RotateCcw size={12} />
            Reset taste
          </button>
        </div>
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Category chips */}
      {results.length === 0 && (
        <div className="px-4 pb-3 shrink-0">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !activeCategory
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/70'
              }`}
            >
              All
            </button>
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-white/70'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Podcast list */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4">
        {error && (
          <p className="text-red-400 text-sm text-center py-8">{error}</p>
        )}
        {isSearching ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {displayPodcasts.map(podcast => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
