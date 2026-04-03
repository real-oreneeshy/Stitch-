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

export function rankEpisodes(
  episodes: Episode[],
  prefs: UserPreferences,
  seenIds: Set<string>
): Episode[] {
  const unseen = episodes.filter(ep => !seenIds.has(ep.id));

  const scored = unseen.map(ep => {
    const pScore = preferenceScore(ep, prefs);
    const rScore = recencyScore(ep.publishedAt);
    const random = Math.random() * 0.1;
    const total = pScore * 0.6 + rScore * 0.3 + random;
    return { ep, total };
  });

  scored.sort((a, b) => b.total - a.total);

  // Interleave: 60% preferred, 30% discovery, 10% serendipity
  const preferred = scored.filter(s => s.total > 0.4).map(s => s.ep);
  const discovery = scored.filter(s => s.total <= 0.4 && s.total > 0.1).map(s => s.ep);
  const serendipity = scored.filter(s => s.total <= 0.1).map(s => s.ep);

  const result: Episode[] = [];
  let pi = 0, di = 0, si = 0;

  while (result.length < unseen.length) {
    const batch = Math.min(10, unseen.length - result.length);
    for (let i = 0; i < batch; i++) {
      const roll = Math.random();
      if (roll < 0.6 && pi < preferred.length) {
        result.push(preferred[pi++]);
      } else if (roll < 0.9 && di < discovery.length) {
        result.push(discovery[di++]);
      } else if (si < serendipity.length) {
        result.push(serendipity[si++]);
      } else if (pi < preferred.length) {
        result.push(preferred[pi++]);
      } else if (di < discovery.length) {
        result.push(discovery[di++]);
      }
    }
  }

  return result;
}
