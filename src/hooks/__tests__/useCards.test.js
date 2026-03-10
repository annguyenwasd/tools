import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockOnValue = vi.fn();
const mockPush = vi.fn();
const mockRemove = vi.fn(() => Promise.resolve());
const mockSet = vi.fn(() => Promise.resolve());
const mockGet = vi.fn();
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

import { useCards } from '../useCards';

describe('useCards', () => {
  let cardsCallback;
  let votesCallback;

  beforeEach(() => {
    vi.clearAllMocks();
    cardsCallback = null;
    votesCallback = null;

    mockOnValue.mockImplementation((refObj, cb) => {
      const path = refObj._path;
      if (path?.includes('/cards')) cardsCallback = cb;
      if (path?.includes('/votes')) votesCallback = cb;
      return vi.fn();
    });

    mockGet.mockResolvedValue({ val: () => null, exists: () => false });
  });

  const snap = (data) => ({ val: () => data, exists: () => data != null });

  it('subscribes to cards and votes refs', () => {
    renderHook(() => useCards('s1', 'u1'));
    expect(mockOnValue).toHaveBeenCalledTimes(2);
  });

  it('addCard pushes trimmed content', () => {
    const { result } = renderHook(() => useCards('s1', 'u1'));
    act(() => result.current.addCard('Went Well', '  Great work  ', 'Alice'));
    expect(mockPush).toHaveBeenCalledWith(
      { _path: 'sessions/s1/cards' },
      expect.objectContaining({
        category: 'Went Well',
        content: 'Great work',
        authorId: 'u1',
        authorName: 'Alice',
      })
    );
  });

  it('addCard rejects empty content', () => {
    const { result } = renderHook(() => useCards('s1', 'u1'));
    act(() => result.current.addCard('Went Well', '   ', 'Alice'));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('deleteCard removes card and votes (cascade)', () => {
    const { result } = renderHook(() => useCards('s1', 'u1'));
    act(() => result.current.deleteCard('c1'));
    expect(mockRemove).toHaveBeenCalledWith({ _path: 'sessions/s1/cards/c1' });
    expect(mockRemove).toHaveBeenCalledWith({ _path: 'sessions/s1/votes/c1' });
  });

  it('EDGE #2: toggleVote is non-atomic (get→set race)', async () => {
    // toggleVote uses get() then set/remove, not a transaction
    // This documents the non-atomic pattern
    mockGet.mockResolvedValue({ val: () => null, exists: () => false });
    const { result } = renderHook(() => useCards('s1', 'u1'));
    await act(async () => {
      await result.current.toggleVote('c1');
    });
    // Since vote doesn't exist, it should set
    expect(mockSet).toHaveBeenCalledWith({ _path: 'sessions/s1/votes/c1/u1' }, true);
  });

  it('toggleVote removes existing vote', async () => {
    mockGet.mockResolvedValue({ val: () => true, exists: () => true });
    const { result } = renderHook(() => useCards('s1', 'u1'));
    await act(async () => {
      await result.current.toggleVote('c1');
    });
    expect(mockRemove).toHaveBeenCalledWith({ _path: 'sessions/s1/votes/c1/u1' });
  });

  it('getVoteCount returns correct count', () => {
    const { result } = renderHook(() => useCards('s1', 'u1'));
    act(() => {
      votesCallback(snap({ c1: { u1: true, u2: true }, c2: { u3: true } }));
    });
    expect(result.current.getVoteCount('c1')).toBe(2);
    expect(result.current.getVoteCount('c2')).toBe(1);
    expect(result.current.getVoteCount('c3')).toBe(0);
  });

  it('hasVoted returns correct boolean', () => {
    const { result } = renderHook(() => useCards('s1', 'u1'));
    act(() => {
      votesCallback(snap({ c1: { u1: true, u2: true } }));
    });
    expect(result.current.hasVoted('c1')).toBe(true);
    expect(result.current.hasVoted('c2')).toBe(false);
  });

  it('getUserVoteCount counts all voted cards', () => {
    const { result } = renderHook(() => useCards('s1', 'u1'));
    act(() => {
      votesCallback(snap({ c1: { u1: true }, c2: { u1: true, u2: true }, c3: { u2: true } }));
    });
    expect(result.current.getUserVoteCount()).toBe(2);
  });

  it('does not subscribe when sessionId is missing', () => {
    renderHook(() => useCards(null, 'u1'));
    expect(mockOnValue).not.toHaveBeenCalled();
  });
});
