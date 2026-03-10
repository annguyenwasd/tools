import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock firebase modules
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

import { useSession } from '../useSession';

describe('useSession', () => {
  let metaCallback;
  let membersCallback;

  beforeEach(() => {
    vi.clearAllMocks();
    metaCallback = null;
    membersCallback = null;

    mockOnValue.mockImplementation((refObj, cb) => {
      const path = refObj._path;
      if (path?.includes('/meta')) metaCallback = cb;
      if (path?.includes('/members')) membersCallback = cb;
      return vi.fn(); // unsubscribe
    });

    // Clear relevant localStorage keys
    localStorage.removeItem('retro_host_s1');
  });

  const snap = (data) => ({ val: () => data, exists: () => data != null });

  it('initial state: loading=true, meta=null', () => {
    const { result } = renderHook(() => useSession('s1', 'u1'));
    expect(result.current.loading).toBe(true);
    expect(result.current.meta).toBeNull();
  });

  it('Firebase data → loading=false, meta populated', () => {
    const { result } = renderHook(() => useSession('s1', 'u1'));
    act(() => {
      metaCallback(snap({ phase: 'write', hostId: 'u1', categories: ['A'] }));
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.meta).toEqual({ phase: 'write', hostId: 'u1', categories: ['A'] });
  });

  it('detects ended when meta.ended=true', () => {
    const { result } = renderHook(() => useSession('s1', 'u1'));
    act(() => metaCallback(snap({ phase: 'write', hostId: 'u1', ended: true })));
    expect(result.current.ended).toBe(true);
    expect(result.current.meta).toBeNull();
  });

  it('detects ended when data becomes null after load', () => {
    const { result } = renderHook(() => useSession('s1', 'u1'));
    act(() => metaCallback(snap({ phase: 'write', hostId: 'u1' })));
    act(() => metaCallback(snap(null)));
    expect(result.current.ended).toBe(true);
  });

  it('isHost computed correctly', () => {
    const { result } = renderHook(() => useSession('s1', 'u1'));
    act(() => metaCallback(snap({ phase: 'write', hostId: 'u1' })));
    expect(result.current.isHost).toBe(true);

    act(() => metaCallback(snap({ phase: 'write', hostId: 'u2' })));
    expect(result.current.isHost).toBe(false);
  });

  it('onlineMembers filtering', () => {
    const { result } = renderHook(() => useSession('s1', 'u1'));
    act(() => {
      metaCallback(snap({ phase: 'write', hostId: 'u1' }));
      membersCallback(snap({
        u1: { name: 'Alice', online: true, joinedAt: 1 },
        u2: { name: 'Bob', online: false, joinedAt: 2 },
        u3: { name: 'Carol', online: true, joinedAt: 3 },
      }));
    });
    expect(result.current.onlineMembers).toHaveLength(2);
  });

  it('advancePhase advances from write to vote', () => {
    const { result } = renderHook(() => useSession('s1', 'u1'));
    act(() => metaCallback(snap({ phase: 'write', hostId: 'u1' })));
    act(() => result.current.advancePhase());
    expect(mockUpdate).toHaveBeenCalledWith({ _path: 'sessions/s1/meta' }, { phase: 'vote' });
  });

  it('advancePhase is noop on export (last phase)', () => {
    const { result } = renderHook(() => useSession('s1', 'u1'));
    act(() => metaCallback(snap({ phase: 'export', hostId: 'u1' })));
    mockUpdate.mockClear();
    act(() => result.current.advancePhase());
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('goToPhase updates phase directly', () => {
    const { result } = renderHook(() => useSession('s1', 'u1'));
    act(() => metaCallback(snap({ phase: 'write', hostId: 'u1' })));
    act(() => result.current.goToPhase('discuss'));
    expect(mockUpdate).toHaveBeenCalledWith({ _path: 'sessions/s1/meta' }, { phase: 'discuss' });
  });

  it('transferHost updates hostId and clears localStorage', () => {
    localStorage.setItem('retro_host_s1', 'u1');
    const { result } = renderHook(() => useSession('s1', 'u1'));
    act(() => metaCallback(snap({ phase: 'write', hostId: 'u1' })));
    act(() => result.current.transferHost('u2'));
    expect(mockUpdate).toHaveBeenCalledWith({ _path: 'sessions/s1/meta' }, { hostId: 'u2' });
    expect(localStorage.getItem('retro_host_s1')).toBeNull();
  });

  it('endSession sets ended and schedules remove', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSession('s1', 'u1'));
    act(() => metaCallback(snap({ phase: 'write', hostId: 'u1' })));
    act(() => result.current.endSession());
    expect(mockUpdate).toHaveBeenCalledWith({ _path: 'sessions/s1/meta' }, { ended: true });
    vi.advanceTimersByTime(5000);
    expect(mockRemove).toHaveBeenCalledWith({ _path: 'sessions/s1' });
    vi.useRealTimers();
  });

  it('EDGE #1: host reclaim fires when original host reconnects', () => {
    localStorage.setItem('retro_host_s1', 'u1');
    const { result } = renderHook(() => useSession('s1', 'u1'));
    act(() => {
      metaCallback(snap({ phase: 'write', hostId: 'u2' })); // someone else is host
      membersCallback(snap({
        u1: { name: 'Alice', online: true, joinedAt: 1 },
        u2: { name: 'Bob', online: true, joinedAt: 2 },
      }));
    });
    // The reclaim effect should fire, updating hostId back to u1
    expect(mockUpdate).toHaveBeenCalledWith({ _path: 'sessions/s1/meta' }, { hostId: 'u1' });
  });

  it('EDGE #3: joinedAt reset causes wrong auto-election winner', () => {
    // If joinedAt resets every time usePresence mounts, the "earliest" member
    // may change, causing a different member to become host
    const { result } = renderHook(() => useSession('s1', 'u2'));
    act(() => {
      metaCallback(snap({ phase: 'write', hostId: 'u1' }));
      membersCallback(snap({
        u1: { name: 'Alice', online: false, joinedAt: 100 }, // host offline
        u2: { name: 'Bob', online: true, joinedAt: 300 },    // reset to later time
        u3: { name: 'Carol', online: true, joinedAt: 200 },  // actually joined later but has earlier reset
      }));
    });
    // u3 has smallest joinedAt among online members, so u3 should be elected
    // But u2 is the one running this hook, so the dedup check fires:
    // u2's joinedAt (300) !== smallest (200), so u2 does NOT write
    expect(mockUpdate).not.toHaveBeenCalledWith(
      { _path: 'sessions/s1/meta' },
      { hostId: 'u2' }
    );
  });

  it('auto-elect dedup: only earliest-joinedAt member writes', () => {
    const { result } = renderHook(() => useSession('s1', 'u2'));
    act(() => {
      metaCallback(snap({ phase: 'write', hostId: 'u1' }));
      membersCallback(snap({
        u1: { name: 'Alice', online: false, joinedAt: 100 },
        u2: { name: 'Bob', online: true, joinedAt: 200 },
        u3: { name: 'Carol', online: true, joinedAt: 300 },
      }));
    });
    // u2 has earliest joinedAt among online, so u2 SHOULD write
    expect(mockUpdate).toHaveBeenCalledWith(
      { _path: 'sessions/s1/meta' },
      { hostId: 'u2' }
    );
  });
});
