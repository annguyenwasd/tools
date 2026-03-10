import { describe, it, expect } from 'vitest';
import { computeStats } from '../pokerStats';

describe('computeStats', () => {
  const members = {
    u1: { name: 'Alice' },
    u2: { name: 'Bob' },
    u3: { name: 'Carol' },
  };

  it('computes average of numeric votes', () => {
    const votes = { u1: '5', u2: '8', u3: '3' };
    const { average } = computeStats(votes, members);
    expect(average).toBe('5.3');
  });

  it('ignores ? and non-numeric votes for average', () => {
    const votes = { u1: '5', u2: '?', u3: '3' };
    const { average } = computeStats(votes, members);
    expect(average).toBe('4.0');
  });

  it('returns null average when all non-numeric', () => {
    const votes = { u1: '?', u2: '?' };
    const { average } = computeStats(votes, members);
    expect(average).toBeNull();
  });

  it('finds most common vote (frequency analysis)', () => {
    const votes = { u1: '5', u2: '5', u3: '8' };
    const { mostCommon } = computeStats(votes, members);
    expect(mostCommon).toBe('5');
  });

  it('detects consensus when all identical', () => {
    const votes = { u1: '5', u2: '5', u3: '5' };
    const { consensus } = computeStats(votes, members);
    expect(consensus).toBe(true);
  });

  it('no consensus when votes differ', () => {
    const votes = { u1: '5', u2: '8' };
    const { consensus } = computeStats(votes, members);
    expect(consensus).toBe(false);
  });

  it('handles empty votes object', () => {
    const { entries, average, mostCommon, consensus } = computeStats({}, members);
    expect(entries).toHaveLength(0);
    expect(average).toBeNull();
    expect(mostCommon).toBe('');
    expect(consensus).toBe(false);
  });

  it('handles T-shirt sizes (non-numeric)', () => {
    const votes = { u1: 'L', u2: 'L', u3: 'XL' };
    const { average, mostCommon } = computeStats(votes, members);
    expect(average).toBeNull();
    expect(mostCommon).toBe('L');
  });

  it('falls back to "Unknown" for unknown member', () => {
    const votes = { unknown_user: '5' };
    const { entries } = computeStats(votes, members);
    expect(entries[0].name).toBe('Unknown');
  });
});
