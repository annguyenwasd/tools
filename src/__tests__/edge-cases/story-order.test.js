import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockOnValue = vi.fn();
const mockUpdate = vi.fn(() => Promise.resolve());
const mockSet = vi.fn(() => Promise.resolve());
const mockRemove = vi.fn(() => Promise.resolve());
const mockPush = vi.fn((_ref, data) => ({ key: `pushed_${Math.random()}` }));
const mockRef = vi.fn((_db, path) => ({ _path: path }));

vi.mock('firebase/database', () => ({
  ref: (...args) => mockRef(...args),
  onValue: (...args) => mockOnValue(...args),
  update: (...args) => mockUpdate(...args),
  set: (...args) => mockSet(...args),
  remove: (...args) => mockRemove(...args),
  push: (...args) => mockPush(...args),
}));

vi.mock('../../firebase', () => ({ db: {} }));

import { usePokerVoting } from '../../hooks/poker/usePokerVoting';

describe('EDGE #6: Concurrent story adds produce duplicate order', () => {
  let storiesCallback;

  beforeEach(() => {
    vi.clearAllMocks();
    storiesCallback = null;
    mockOnValue.mockImplementation((refObj, cb) => {
      const path = refObj._path;
      if (path?.endsWith('/stories')) storiesCallback = cb;
      return vi.fn();
    });
  });

  const snap = (data) => ({ val: () => data, exists: () => data != null });

  it('stale closure causes duplicate order values when adding stories rapidly', async () => {
    const { result } = renderHook(() => usePokerVoting('s1', null));
    act(() => storiesCallback(snap({})));

    // Rapidly add two stories before state updates
    await act(async () => { await result.current.addStory({ name: 'Story A' }); });
    await act(async () => { await result.current.addStory({ name: 'Story B' }); });

    // Both used order: 0 because `stories` state didn't change between calls
    // (no real Firebase to trigger onValue with updated data)
    const pushCalls = mockPush.mock.calls;
    expect(pushCalls[0][1].order).toBe(0);
    expect(pushCalls[1][1].order).toBe(0);
    // This is the bug: both stories get the same order
  });
});
