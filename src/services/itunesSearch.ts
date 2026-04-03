import type { Podcast } from '../types/podcast';

interface ItunesResult {
  collectionId: number;
  collectionName: string;
  artistName: string;
  collectionViewUrl: string;
  feedUrl: string;
  artworkUrl600: string;
  artworkUrl100: string;
  primaryGenreName: string;
  genres: string[];
  trackCount: number;
  description?: string;
}

function mapResult(r: ItunesResult): Podcast | null {
  if (!r.feedUrl) return null;
  return {
    id: String(r.collectionId),
    title: r.collectionName,
    author: r.artistName,
    description: r.description ?? '',
    imageUrl: r.artworkUrl600 || r.artworkUrl100,
    feedUrl: r.feedUrl,
    categories: r.genres ?? [r.primaryGenreName].filter(Boolean),
    episodeCount: r.trackCount,
  };
}

export async function searchPodcasts(query: string, limit = 20): Promise<Podcast[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=podcast&limit=${limit}&entity=podcast`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('iTunes search failed');
  const data = await res.json();
  return (data.results as ItunesResult[])
    .map(mapResult)
    .filter((p): p is Podcast => p !== null);
}

export async function getPodcastById(itunesId: string): Promise<Podcast | null> {
  const url = `https://itunes.apple.com/lookup?id=${itunesId}&entity=podcast`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.results?.length) return null;
  return mapResult(data.results[0]);
}
