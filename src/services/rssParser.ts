import { fetchWithProxy } from './corsProxy';
import type { Episode, Podcast } from '../types/podcast';

function parseISO8601Duration(duration: string): number {
  if (!duration) return 0;
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

/**
 * Stable deterministic ID — same inputs always produce the same output.
 * Uses the RSS GUID when present (preferred), otherwise hashes
 * podcastId + title + pubDate so the ID survives across loads even if
 * GUID is absent or contains unpredictable query strings.
 */
function stableId(podcastId: string, title: string, pubDate: string, guid: string): string {
  // Use GUID only if it looks like a clean stable identifier
  if (guid && guid.length > 0 && guid.length < 200 && !guid.includes(' ')) {
    return `${podcastId}::${guid}`;
  }
  // Fallback: hash of podcast + title + date
  const raw = `${podcastId}::${title}::${pubDate}`;
  let h = 5381;
  for (let i = 0; i < raw.length; i++) {
    h = Math.imul(31, h) + raw.charCodeAt(i) | 0;
  }
  return `ep_${Math.abs(h).toString(36)}`;
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
    const title = getTextContent(item, 'title') || 'Untitled Episode';
    const guid = getTextContent(item, 'guid');

    const description =
      getTextContent(item, 'itunes\\:summary') ||
      getTextContent(item, 'description') ||
      '';

    episodes.push({
      id: stableId(podcast.id, title, pubDateStr, guid),
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
