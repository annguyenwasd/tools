import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockOnValue = vi.fn();
const mockUpdate = vi.fn(() => Promise.resolve());
const mockSet = vi.fn(() => Promise.resolve());
const mockRemove = vi.fn(() => Promise.resolve());
const mockRef = vi.fn((_db, path) => ({ _path: path }));

vi.mock('firebase/database', () => ({
  ref: (...args) => mockRef(...args),
  onValue: (...args) => mockOnValue(...args),
  update: (...args) => mockUpdate(...args),
  set: (...args) => mockSet(...args),
  remove: (...args) => mockRemove(...args),
}));

vi.mock('../../../firebase', () => ({ db: {} }));

import { usePokerSession, createPokerSession } from '../usePokerSession';

describe('usePokerSession', () => {
  let metaCallback;
  let membersCallback;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('poker_host_s1');
    metaCallback = null;
    membersCallback = null;

    mockOnValue.mockImplementation((refObj, cb) => {
      const path = refObj._path;
      if (path?.includes('/meta')) metaCallback = cb;
      if (path?.includes('/members')) membersCallback = cb;
      return vi.fn();
    });
  });

  const snap = (data) => ({ val: () => data, exists: () => data != null });

  it('uses poker/ database path', () => {
    renderHook(() => usePokerSession('s1', 'u1'));
    expect(mockRef).toHaveBeenCalledWith({}, 'poker/s1/meta');
    expect(mockRef).toHaveBeenCalledWith({}, 'poker/s1/members');
  });

  it('selectStory updates currentStoryId and sets revealed=false', () => {
    const { result } = renderHook(() => usePokerSession('s1', 'u1'));
    act(() => metaCallback(snap({ hostId: 'u1', revealed: true })));
    act(() => result.current.selectStory('story1'));
    expect(mockUpdate).toHaveBeenCalledWith(
      { _path: 'poker/s1/meta' },
      { currentStoryId: 'story1', revealed: false }
    );
  });

  it('revealVotes sets revealed=true', () => {
    const { result } = renderHook(() => usePokerSession('s1', 'u1'));
    act(() => metaCallback(snap({ hostId: 'u1' })));
    act(() => result.current.revealVotes());
    expect(mockUpdate).toHaveBeenCalledWith(
      { _path: 'poker/s1/meta' },
      { revealed: true }
    );
  });

  it('restartVote sets revealed=false', () => {
    const { result } = renderHook(() => usePokerSession('s1', 'u1'));
    act(() => metaCallback(snap({ hostId: 'u1' })));
    act(() => result.current.restartVote());
    expect(mockUpdate).toHaveBeenCalledWith(
      { _path: 'poker/s1/meta' },
      { revealed: false }
    );
  });

  it('transferHost clears poker localStorage key', () => {
    localStorage.setItem('poker_host_s1', 'u1');
    const { result } = renderHook(() => usePokerSession('s1', 'u1'));
    act(() => metaCallback(snap({ hostId: 'u1' })));
    act(() => result.current.transferHost('u2'));
    expect(localStorage.getItem('poker_host_s1')).toBeNull();
    expect(mockUpdate).toHaveBeenCalledWith(
      { _path: 'poker/s1/meta' },
      { hostId: 'u2' }
    );
  });

  it('endSession sets ended and schedules remove', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePokerSession('s1', 'u1'));
    act(() => metaCallback(snap({ hostId: 'u1' })));
    act(() => result.current.endSession());
    expect(mockUpdate).toHaveBeenCalledWith({ _path: 'poker/s1/meta' }, { ended: true });
    vi.advanceTimersByTime(5000);
    expect(mockRemove).toHaveBeenCalledWith({ _path: 'poker/s1' });
    vi.useRealTimers();
  });

  it('createPokerSession sets meta + member', async () => {
    await createPokerSession('s1', 'u1', 'Alice', 'fibonacci');
    expect(mockSet).toHaveBeenCalledWith(
      { _path: 'poker/s1/meta' },
      expect.objectContaining({ hostId: 'u1', cardSet: 'fibonacci', revealed: false })
    );
    expect(mockSet).toHaveBeenCalledWith(
      { _path: 'poker/s1/members/u1' },
      expect.objectContaining({ name: 'Alice', online: true })
    );
  });

  it('isHost reflects meta.hostId', () => {
    const { result } = renderHook(() => usePokerSession('s1', 'u1'));
    act(() => metaCallback(snap({ hostId: 'u1' })));
    expect(result.current.isHost).toBe(true);
    act(() => metaCallback(snap({ hostId: 'u2' })));
    expect(result.current.isHost).toBe(false);
  });
});
