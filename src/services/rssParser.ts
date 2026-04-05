import type { Episode, Podcast } from '../types/podcast';

// iTunes Lookup API — CORS-enabled natively (no proxy), no API key, Apple CDN speeds.
// Returns JSON with episodeUrl as the full audio URL (not a 30-second preview).
const ITUNES_LOOKUP = 'https://itunes.apple.com/lookup';

interface ItunesResult {
  wrapperType: string;
  kind?: string;
  trackId?: number;
  trackName?: string;
  description?: string;
  previewUrl?: string;
  artworkUrl160?: string;
  artworkUrl600?: string;
  releaseDate?: string;
  trackTimeMillis?: number;
}

interface ItunesResponse {
  resultCount: number;
  results: ItunesResult[];
}

export async function parsePodcastFeed(podcast: Podcast): Promise<Episode[]> {
  const url = `${ITUNES_LOOKUP}?id=${encodeURIComponent(podcast.id)}&entity=podcastEpisode&limit=20`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`iTunes API ${res.status}`);

  const data: ItunesResponse = await res.json();
  const episodes: Episode[] = [];

  for (const item of data.results) {
    // First result is the podcast collection, skip it
    if (item.wrapperType === 'collection') continue;
    if (!item.previewUrl || !item.trackId) continue;

    const imageUrl = item.artworkUrl600 || item.artworkUrl160 || podcast.imageUrl;
    const description = (item.description ?? '').replace(/<[^>]*>/g, '').trim();

    episodes.push({
      id: `${podcast.id}::${item.trackId}`,
      podcastId: podcast.id,
      podcastTitle: podcast.title,
      podcastImageUrl: podcast.imageUrl,
      title: item.trackName || 'Untitled Episode',
      description,
      audioUrl: item.previewUrl,
      imageUrl,
      duration: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 0,
      publishedAt: item.releaseDate ? new Date(item.releaseDate) : new Date(),
      categories: podcast.categories,
    });
  }

  return episodes;
}
