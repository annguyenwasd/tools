import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockOnValue = vi.fn();
const mockGet = vi.fn();
const mockSet = vi.fn(() => Promise.resolve());
const mockRemove = vi.fn(() => Promise.resolve());
const mockPush = vi.fn();
const mockRef = vi.fn((_db, path) => ({ _path: path }));

vi.mock('firebase/database', () => ({
  ref: (...args) => mockRef(...args),
  onValue: (...args) => mockOnValue(...args),
  push: (...args) => mockPush(...args),
  remove: (...args) => mockRemove(...args),
  set: (...args) => mockSet(...args),
  get: (...args) => mockGet(...args),
}));

vi.mock('../../firebase', () => ({ db: {} }));

import { useCards } from '../../hooks/useCards';

describe('EDGE #2: Non-atomic toggleVote race', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnValue.mockImplementation(() => vi.fn());
  });

  it('concurrent toggleVote: get→set is not transactional', async () => {
    // Two users toggle the same card simultaneously.
    // The get() call for both resolves before either set() completes.
    // Both see "no vote exists" and both add a vote, or both see
    // "vote exists" and both remove it.

    // Simulate: vote doesn't exist yet
    mockGet.mockResolvedValue({ val: () => null, exists: () => false });

    const { result: hook1 } = renderHook(() => useCards('s1', 'u1'));
    const { result: hook2 } = renderHook(() => useCards('s1', 'u1'));

    // Both reads see "no vote" simultaneously
    await act(async () => { await hook1.current.toggleVote('c1'); });
    await act(async () => { await hook2.current.toggleVote('c1'); });

    // Both called set (adding vote) instead of one add + one remove
    const setCalls = mockSet.mock.calls;
    expect(setCalls).toHaveLength(2);
    // Documents: both wrote true, no conflict resolution
    expect(setCalls[0][1]).toBe(true);
    expect(setCalls[1][1]).toBe(true);
  });

  it('toggleVote uses get→set instead of transaction', async () => {
    // The hook uses get() followed by set/remove, not runTransaction
    mockGet.mockResolvedValue({ val: () => true, exists: () => true });

    const { result } = renderHook(() => useCards('s1', 'u1'));
    await act(async () => { await result.current.toggleVote('c1'); });

    // Verify get was called (non-atomic pattern)
    expect(mockGet).toHaveBeenCalled();
    // Then remove was called (not part of a transaction)
    expect(mockRemove).toHaveBeenCalledWith({ _path: 'sessions/s1/votes/c1/u1' });
  });
});
