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
    const catScore = prefs.categoryScores[cat] ?? 0;
    score += catScore;
    weight += 1;
  }

  const podScore = prefs.podcastScores[episode.podcastId] ?? 0;
  score += podScore * 2;
  weight += 2;

  return weight > 0 ? score / weight : 0;
}

/**
 * Interleave episodes across podcasts using a round-robin approach.
 * Each "column" is one podcast's episodes sorted by score descending.
 * We pick one episode per podcast per round, cycling through podcasts
 * ordered by their best episode's score — so preferred podcasts still
 * appear more frequently but never cluster consecutively.
 */
function interleaveByPodcast(scored: { ep: Episode; total: number }[]): Episode[] {
  // Group by podcast, each group sorted best-first
  const groups = new Map<string, { ep: Episode; total: number }[]>();
  for (const item of scored) {
    const key = item.ep.podcastId;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  // Sort podcasts by their top episode score (best podcast leads each round)
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

export function rankEpisodes(
  episodes: Episode[],
  prefs: UserPreferences,
  seenIds: Set<string>
): Episode[] {
  const unseen = episodes.filter(ep => !seenIds.has(ep.id));

  const scored = unseen.map(ep => {
    const pScore = preferenceScore(ep, prefs);
    const rScore = recencyScore(ep.publishedAt);
    // Small random jitter so episodes from same podcast aren't always in same order
    const jitter = Math.random() * 0.05;
    const total = pScore * 0.6 + rScore * 0.3 + jitter;
    return { ep, total };
  });

  // Sort within each podcast group before interleaving
  scored.sort((a, b) => b.total - a.total);

  return interleaveByPodcast(scored);
}
