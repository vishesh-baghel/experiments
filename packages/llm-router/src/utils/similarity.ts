/**
 * Vector similarity utilities for semantic caching and ML classification
 */

/**
 * Calculate cosine similarity between two vectors
 * Returns value between -1 and 1, where 1 means identical vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Find the most similar vector from a list
 */
export function findMostSimilar(
  query: number[],
  candidates: number[][]
): { index: number; similarity: number } {
  let maxSimilarity = -1;
  let maxIndex = -1;

  for (let i = 0; i < candidates.length; i++) {
    const similarity = cosineSimilarity(query, candidates[i]);
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      maxIndex = i;
    }
  }

  return { index: maxIndex, similarity: maxSimilarity };
}
