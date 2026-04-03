import { fetchWithProxy } from './corsProxy';
import type { Episode, Podcast } from '../types/podcast';

function parseISO8601Duration(duration: string): number {
  if (!duration) return 0;
  // Handle HH:MM:SS or MM:SS
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parseInt(duration, 10) || 0;
}

function getTextContent(el: Element | null, tag: string): string {
  if (!el) return '';
  const node = el.querySelector(tag);
  return node?.textContent?.trim() ?? '';
}

function getAttr(el: Element | null, tag: string, attr: string): string {
  if (!el) return '';
  const node = el.querySelector(tag);
  return node?.getAttribute(attr) ?? '';
}

export async function parsePodcastFeed(podcast: Podcast): Promise<Episode[]> {
  const xml = await fetchWithProxy(podcast.feedUrl);
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');

  const items = Array.from(doc.querySelectorAll('item'));
  const episodes: Episode[] = [];

  for (const item of items.slice(0, 20)) {
    const audioUrl =
      item.querySelector('enclosure')?.getAttribute('url') ??
      item.querySelector('link')?.textContent?.trim() ??
      '';

    if (!audioUrl) continue;

    const imageUrl =
      item.querySelector('image url')?.textContent?.trim() ??
      getAttr(item, 'itunes\\:image, image', 'href') ??
      podcast.imageUrl;

    const durationRaw = getTextContent(item, 'itunes\\:duration');
    const duration = parseISO8601Duration(durationRaw);

    const pubDateStr = getTextContent(item, 'pubDate');
    const publishedAt = pubDateStr ? new Date(pubDateStr) : new Date();

    const title =
      getTextContent(item, 'title') || 'Untitled Episode';

    const description =
      getTextContent(item, 'itunes\\:summary') ||
      getTextContent(item, 'description') ||
      '';

    const guid =
      getTextContent(item, 'guid') ||
      `${podcast.id}-${title}-${publishedAt.getTime()}`;

    episodes.push({
      id: guid,
      podcastId: podcast.id,
      podcastTitle: podcast.title,
      podcastImageUrl: podcast.imageUrl,
      title,
      description: description.replace(/<[^>]*>/g, '').trim(),
      audioUrl,
      imageUrl,
      duration,
      publishedAt,
      categories: podcast.categories,
    });
  }

  return episodes;
}
