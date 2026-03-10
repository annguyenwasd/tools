/**
 * Compute voting statistics for planning poker.
 * Extracted from ResultPanel for testability.
 */
export function computeStats(votes, members) {
  const entries = Object.entries(votes).map(([userId, value]) => ({
    userId,
    name: members[userId]?.name || 'Unknown',
    value,
  }));

  const numeric = entries.map((e) => parseFloat(e.value)).filter((v) => !isNaN(v));
  const average = numeric.length > 0
    ? (numeric.reduce((a, b) => a + b, 0) / numeric.length).toFixed(1)
    : null;

  const frequency = {};
  entries.forEach(({ value }) => {
    frequency[value] = (frequency[value] || 0) + 1;
  });
  const mostCommon = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

  const consensus = entries.length > 0 && Object.keys(frequency).length === 1;

  return { entries, average, mostCommon, consensus };
}
