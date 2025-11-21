// Fuzzy search utility
// Matches strings with gaps allowed, scoring by proximity

/**
 * Simple fuzzy search score - higher is better match
 * Matches characters in order but allows gaps
 */
export const fuzzyMatch = (query: string, target: string): number => {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  if (!q) return t ? 0 : 1; // empty query matches non-empty targets poorly
  if (!t) return 0;

  let score = 0;
  let qIndex = 0;
  let tIndex = 0;
  let lastMatchIndex = -1;

  while (qIndex < q.length && tIndex < t.length) {
    if (q[qIndex] === t[tIndex]) {
      score++;
      // Bonus for consecutive matches or start of word
      if (tIndex === 0 || t[tIndex - 1] === " " || t[tIndex - 1] === "-") {
        score += 2;
      }
      // Penalty for gaps gets larger as gap increases
      if (lastMatchIndex >= 0) {
        const gap = tIndex - lastMatchIndex - 1;
        if (gap > 0) {
          score -= gap * 0.1;
        }
      }
      lastMatchIndex = tIndex;
      qIndex++;
    }
    tIndex++;
  }

  // If query not fully matched, score is 0
  if (qIndex < q.length) return 0;

  // Penalty for matched portion being far into the string
  const targetMatchLength = lastMatchIndex + 1;
  const unmatchedStart = targetMatchLength - qIndex;
  if (unmatchedStart > 0) {
    score -= unmatchedStart * 0.05;
  }

  return score;
};

/**
 * Search and rank results by fuzzy matching
 */
export const fuzzySearch = <
  T extends { name: string; description?: string; aliases?: string[] },
>(
  query: string,
  items: T[],
): { item: T; score: number }[] => {
  if (!query.trim()) return [];

  const results = items
    .map((item) => {
      const nameScore = fuzzyMatch(query, item.name);
      const aliasScore = Math.max(
        ...((item.aliases || []).map((alias) => fuzzyMatch(query, alias)) || [
          0,
        ]),
      );
      const descriptionScore = item.description
        ? fuzzyMatch(query, item.description)
        : 0;
      // Name and alias matches are weighted higher than description matches
      const score = Math.max(
        nameScore * 1.5,
        aliasScore * 1.3,
        descriptionScore,
      );
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return results;
};
