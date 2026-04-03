export interface Podcast {
  id: string;
  title: string;
  author: string;
  description: string;
  imageUrl: string;
  feedUrl: string;
  categories: string[];
  episodeCount?: number;
}

export interface Episode {
  id: string;
  podcastId: string;
  podcastTitle: string;
  podcastImageUrl: string;
  title: string;
  description: string;
  audioUrl: string;
  imageUrl: string;
  duration: number; // seconds
  publishedAt: Date;
  categories: string[];
}

export type PodcastCategory =
  | 'Technology'
  | 'Business'
  | 'Science'
  | 'Health'
  | 'True Crime'
  | 'Comedy'
  | 'News'
  | 'Society'
  | 'Education'
  | 'Sports'
  | 'Arts'
  | 'History';

export interface EngagementEvent {
  episodeId: string;
  podcastId: string;
  categories: string[];
  type: 'play_start' | 'skip_early' | 'complete' | 'like' | 'share';
  listenRatio?: number; // 0.0 - 1.0
  timestamp: number;
}

export interface UserPreferences {
  categoryScores: Record<string, number>;
  podcastScores: Record<string, number>;
  likedEpisodeIds: Set<string>;
  events: EngagementEvent[];
  onboardingComplete: boolean;
  selectedCategories: string[];
}
