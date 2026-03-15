import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockOnValue = vi.fn();
const mockUpdate = vi.fn(() => Promise.resolve());
const mockSet = vi.fn(() => Promise.resolve());
const mockRemove = vi.fn(() => Promise.resolve());
const mockPush = vi.fn((_ref, data) => ({ key: `pushed_${Date.now()}` }));
const mockRef = vi.fn((_db, path) => ({ _path: path }));

vi.mock('firebase/database', () => ({
  ref: (...args) => mockRef(...args),
  onValue: (...args) => mockOnValue(...args),
  update: (...args) => mockUpdate(...args),
  set: (...args) => mockSet(...args),
  remove: (...args) => mockRemove(...args),
  push: (...args) => mockPush(...args),
}));

vi.mock('../../../firebase', () => ({ db: {} }));

import { usePokerVoting } from '../usePokerVoting';

describe('usePokerVoting', () => {
  let storiesCallback;
  let votesCallback;

  beforeEach(() => {
    vi.clearAllMocks();
    storiesCallback = null;
    votesCallback = null;

    mockOnValue.mockImplementation((refObj, cb) => {
      const path = refObj._path;
      // Use endsWith to distinguish /stories from /votes/storyId
      if (path?.endsWith('/stories')) storiesCallback = cb;
      if (path?.includes('/votes/')) votesCallback = cb;
      return vi.fn();
    });
  });

  const snap = (data) => ({ val: () => data, exists: () => data != null });

  it('subscribes to stories and votes', () => {
    renderHook(() => usePokerVoting('s1', 'story1'));
    expect(mockOnValue).toHaveBeenCalledTimes(2);
  });

  it('clears votes when no currentStoryId', () => {
    const { result } = renderHook(() => usePokerVoting('s1', null));
    expect(result.current.votes).toEqual({});
  });

  it('addStory with order based on existing count', async () => {
    const { result } = renderHook(() => usePokerVoting('s1', null));
    act(() => {
      storiesCallback(snap({ s1: { name: 'A', order: 0 }, s2: { name: 'B', order: 1 } }));
    });
    await act(async () => {
      await result.current.addStory({ name: 'New Story', formattedId: 'US3' });
    });
    expect(mockPush).toHaveBeenCalledWith(
      { _path: 'poker/s1/stories' },
      expect.objectContaining({ name: 'New Story', order: 2 })
    );
  });

  it('EDGE #6: concurrent addStory can produce duplicate order (stale closure)', async () => {
    // Both calls see the same stories.length, so both get order = 0
    const { result } = renderHook(() => usePokerVoting('s1', null));
    act(() => storiesCallback(snap({})));

    // Fire them sequentially but both see order 0 due to stale closure
    await act(async () => { await result.current.addStory({ name: 'A' }); });
    await act(async () => { await result.current.addStory({ name: 'B' }); });

    // Both pushes used order: 0 because stories state didn't update (no real Firebase)
    const pushCalls = mockPush.mock.calls;
    const orders = pushCalls.map(([, data]) => data.order);
    expect(orders[0]).toBe(0);
    expect(orders[1]).toBe(0); // duplicate! documents the bug
  });

  it('EDGE #8: importStories key uses index for uniqueness', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const { result } = renderHook(() => usePokerVoting('s1', null));
    act(() => storiesCallback(snap({})));

    await act(async () => {
      await result.current.importStories([
        { name: 'A', formattedId: 'US1' },
        { name: 'B', formattedId: 'US2' },
      ]);
    });

    // Keys are `imported_1000_0` and `imported_1000_1` - unique due to index
    const updateCall = mockUpdate.mock.calls[0];
    const keys = Object.keys(updateCall[1]);
    expect(keys[0]).toBe('imported_1000_0');
    expect(keys[1]).toBe('imported_1000_1');
    expect(new Set(keys).size).toBe(keys.length); // all unique

    vi.spyOn(Date, 'now').mockRestore();
  });

  it('importStories continues order from existing count', async () => {
    const { result } = renderHook(() => usePokerVoting('s1', null));
    act(() => storiesCallback(snap({ s1: { name: 'Existing', order: 0 } })));

    await act(async () => {
      await result.current.importStories([{ name: 'New1' }, { name: 'New2' }]);
    });

    const updateCall = mockUpdate.mock.calls[0];
    const stories = Object.values(updateCall[1]);
    expect(stories[0].order).toBe(1);
    expect(stories[1].order).toBe(2);
  });

  it('setFinalEstimate updates story without resetting currentStoryId', async () => {
    const { result } = renderHook(() => usePokerVoting('s1', 'story1'));
    await act(async () => {
      await result.current.setFinalEstimate('story1', '8');
    });
    expect(mockUpdate).toHaveBeenCalledWith(
      { _path: 'poker/s1/stories/story1' },
      { finalEstimate: '8' }
    );
    expect(mockUpdate).not.toHaveBeenCalledWith(
      { _path: 'poker/s1/meta' },
      { currentStoryId: null, revealed: false }
    );
  });

  it('castVote sets vote value', async () => {
    const { result } = renderHook(() => usePokerVoting('s1', 'story1'));
    await act(async () => {
      await result.current.castVote('u1', '5');
    });
    expect(mockSet).toHaveBeenCalledWith(
      { _path: 'poker/s1/votes/story1/u1' },
      '5'
    );
  });

  it('castVote is noop without currentStoryId', async () => {
    const { result } = renderHook(() => usePokerVoting('s1', null));
    await act(async () => {
      await result.current.castVote('u1', '5');
    });
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('deleteStory removes story and votes (cascade)', async () => {
    const { result } = renderHook(() => usePokerVoting('s1', null));
    await act(async () => {
      await result.current.deleteStory('story1');
    });
    expect(mockRemove).toHaveBeenCalledWith({ _path: 'poker/s1/stories/story1' });
    expect(mockRemove).toHaveBeenCalledWith({ _path: 'poker/s1/votes/story1' });
  });
});
