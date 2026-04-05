import type { Episode, Podcast } from '../types/podcast';

// rss2json converts any RSS feed to JSON, caches results server-side,
// and is CORS-friendly — no proxy chain needed.
const RSS2JSON = 'https://api.rss2json.com/v1.api';

interface Rss2JsonEnclosure {
  link: string;
  type: string;
  length: number;
}

interface Rss2JsonItem {
  title: string;
  pubDate: string;
  link: string;
  guid: string;
  thumbnail: string;
  description: string;
  enclosure: Rss2JsonEnclosure | Record<string, never>;
  categories: string[];
}

interface Rss2JsonResponse {
  status: string;
  feed: { image: string; title: string };
  items: Rss2JsonItem[];
}

function stableId(podcastId: string, title: string, pubDate: string, guid: string): string {
  if (guid && guid.length > 0 && guid.length < 200 && !guid.includes(' ')) {
    return `${podcastId}::${guid}`;
  }
  const raw = `${podcastId}::${title}::${pubDate}`;
  let h = 5381;
  for (let i = 0; i < raw.length; i++) {
    h = Math.imul(31, h) + raw.charCodeAt(i) | 0;
  }
  return `ep_${Math.abs(h).toString(36)}`;
}

export async function parsePodcastFeed(podcast: Podcast): Promise<Episode[]> {
  const url = `${RSS2JSON}?rss_url=${encodeURIComponent(podcast.feedUrl)}&count=20`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`rss2json ${res.status}`);

  const data: Rss2JsonResponse = await res.json();
  if (data.status !== 'ok') throw new Error(`rss2json status: ${data.status}`);

  const episodes: Episode[] = [];

  for (const item of data.items) {
    const enc = item.enclosure as Rss2JsonEnclosure | Record<string, never>;
    const audioUrl = 'link' in enc ? enc.link : '';
    if (!audioUrl) continue;

    const imageUrl = item.thumbnail || podcast.imageUrl;
    const description = (item.description || '').replace(/<[^>]*>/g, '').trim();

    episodes.push({
      id: stableId(podcast.id, item.title, item.pubDate, item.guid),
      podcastId: podcast.id,
      podcastTitle: podcast.title,
      podcastImageUrl: podcast.imageUrl,
      title: item.title || 'Untitled Episode',
      description,
      audioUrl,
      imageUrl,
      duration: 0,
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      categories: podcast.categories,
    });
  }

  return episodes;
}
