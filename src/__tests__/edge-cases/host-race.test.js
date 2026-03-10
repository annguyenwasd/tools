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

vi.mock('../../firebase', () => ({ db: {} }));

import { useSession } from '../../hooks/useSession';

describe('EDGE #1: Host race condition', () => {
  let metaCallback, membersCallback;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('retro_host_s1');
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

  it('two browsers both claim host: reclaim overrides auto-election', () => {
    // User A was original host, goes offline, B auto-elects as host,
    // then A comes back and reclaims. This creates a race.
    localStorage.setItem('retro_host_s1', 'userA');
    const { result } = renderHook(() => useSession('s1', 'userA'));

    act(() => {
      metaCallback(snap({ phase: 'write', hostId: 'userB' })); // B is current host
      membersCallback(snap({
        userA: { name: 'A', online: true, joinedAt: 100 },
        userB: { name: 'B', online: true, joinedAt: 200 },
      }));
    });

    // A reclaims because localStorage says A was the original host
    expect(mockUpdate).toHaveBeenCalledWith(
      { _path: 'sessions/s1/meta' },
      { hostId: 'userA' }
    );
  });

  it('reclaim and auto-elect conflict: both effects may fire', () => {
    // If the current host goes offline and the original host reclaims,
    // both the reclaim effect and auto-elect effect may try to update hostId
    localStorage.setItem('retro_host_s1', 'userA');
    const { result } = renderHook(() => useSession('s1', 'userA'));

    act(() => {
      metaCallback(snap({ phase: 'write', hostId: 'userC' })); // C is host
      membersCallback(snap({
        userA: { name: 'A', online: true, joinedAt: 100 },
        userB: { name: 'B', online: true, joinedAt: 200 },
        userC: { name: 'C', online: false, joinedAt: 50 }, // host offline
      }));
    });

    // Both reclaim (because localStorage) and auto-elect (because host offline)
    // could fire. The reclaim effect writes hostId: userA
    const updateCalls = mockUpdate.mock.calls.filter(
      ([ref]) => ref._path === 'sessions/s1/meta'
    );
    expect(updateCalls.length).toBeGreaterThanOrEqual(1);
  });
});
