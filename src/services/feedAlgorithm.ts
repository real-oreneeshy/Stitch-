import type { Episode, UserPreferences } from '../types/podcast';

const RECENCY_HALF_LIFE_DAYS = 30;

function recencyScore(publishedAt: Date): number {
  const ageDays = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-ageDays / RECENCY_HALF_LIFE_DAYS);
}

function preferenceScore(episode: Episode, prefs: UserPreferences): number {
  let score = 0;
  let weight = 0;
  for (const cat of episode.categories) {
    score += prefs.categoryScores[cat] ?? 0;
    weight += 1;
  }
  score += (prefs.podcastScores[episode.podcastId] ?? 0) * 2;
  weight += 2;
  return weight > 0 ? score / weight : 0;
}

function interleaveByPodcast(scored: { ep: Episode; total: number }[]): Episode[] {
  const groups = new Map<string, { ep: Episode; total: number }[]>();
  for (const item of scored) {
    const key = item.ep.podcastId;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  const podcastQueues = Array.from(groups.values()).sort(
    (a, b) => b[0].total - a[0].total
  );

  const result: Episode[] = [];
  let hasMore = true;
  while (hasMore) {
    hasMore = false;
    for (const queue of podcastQueues) {
      if (queue.length > 0) {
        result.push(queue.shift()!.ep);
        if (queue.length > 0) hasMore = true;
      }
    }
  }
  return result;
}

/**
 * Hard enforcement: scan the list and fix any remaining consecutive
 * same-podcast pairs by swapping the offender with the next available
 * episode from a different podcast. This is a safety net on top of
 * interleaveByPodcast — needed when the pool has very few podcasts
 * or when replaceUpcoming inserts a promoted episode mid-queue.
 */
function enforceNonConsecutive(episodes: Episode[]): Episode[] {
  const result = [...episodes];
  for (let i = 1; i < result.length; i++) {
    if (result[i].podcastId !== result[i - 1].podcastId) continue;
    // Find the closest episode ahead that breaks the chain
    let swapped = false;
    for (let j = i + 1; j < result.length; j++) {
      if (result[j].podcastId !== result[i - 1].podcastId) {
        [result[i], result[j]] = [result[j], result[i]];
        swapped = true;
        break;
      }
    }
    // If no swap was possible (all remaining episodes are the same podcast), stop
    if (!swapped) break;
  }
  return result;
}

export function rankEpisodes(
  episodes: Episode[],
  prefs: UserPreferences,
  seenIds: Set<string>
): Episode[] {
  const unseen = episodes.filter(ep => !seenIds.has(ep.id));

  const scored = unseen.map(ep => {
    const pScore = preferenceScore(ep, prefs);
    const rScore = recencyScore(ep.publishedAt);
    const jitter = Math.random() * 0.05;
    const total = pScore * 0.6 + rScore * 0.3 + jitter;
    return { ep, total };
  });

  scored.sort((a, b) => b.total - a.total);

  const interleaved = interleaveByPodcast(scored);
  return enforceNonConsecutive(interleaved);
}
