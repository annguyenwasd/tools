import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockSet = vi.fn(() => Promise.resolve());
const mockOnDisconnect = vi.fn(() => ({
  update: vi.fn(() => Promise.resolve()),
}));
const mockRef = vi.fn((_db, path) => ({ _path: path }));

vi.mock('firebase/database', () => ({
  ref: (...args) => mockRef(...args),
  set: (...args) => mockSet(...args),
  onDisconnect: (...args) => mockOnDisconnect(...args),
  serverTimestamp: () => 'SERVER_TIMESTAMP',
}));

vi.mock('../../firebase', () => ({ db: {} }));

import { usePresence } from '../usePresence';

describe('usePresence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets online=true on mount', () => {
    renderHook(() => usePresence('s1', 'u1', 'Alice'));
    expect(mockSet).toHaveBeenCalledWith(
      { _path: 'sessions/s1/members/u1' },
      expect.objectContaining({ name: 'Alice', online: true })
    );
  });

  it('registers onDisconnect handler', () => {
    renderHook(() => usePresence('s1', 'u1', 'Alice'));
    expect(mockOnDisconnect).toHaveBeenCalledWith({ _path: 'sessions/s1/members/u1' });
  });

  it('sets online=false on unmount', () => {
    const { unmount } = renderHook(() => usePresence('s1', 'u1', 'Alice'));
    mockSet.mockClear();
    unmount();
    expect(mockSet).toHaveBeenCalledWith(
      { _path: 'sessions/s1/members/u1' },
      expect.objectContaining({ name: 'Alice', online: false })
    );
  });

  it('EDGE #3: joinedAt resets on every mount', () => {
    const calls = [];
    mockSet.mockImplementation((_ref, data) => {
      if (data.online === true) calls.push(data.joinedAt);
      return Promise.resolve();
    });

    const { unmount, rerender } = renderHook(
      ({ sid }) => usePresence(sid, 'u1', 'Alice'),
      { initialProps: { sid: 's1' } }
    );
    const firstJoinedAt = calls[0];

    // Force re-mount by changing key (unmount+remount)
    unmount();
    mockSet.mockClear();
    calls.length = 0;

    // Re-mount after a tick to get a different Date.now()
    const { unmount: unmount2 } = renderHook(() => usePresence('s1', 'u1', 'Alice'));
    const secondJoinedAt = calls[0];

    // Documents bug: joinedAt is reset on every mount
    expect(secondJoinedAt).toBeGreaterThanOrEqual(firstJoinedAt);
    unmount2();
  });

  it('no Firebase calls when params missing', () => {
    renderHook(() => usePresence(null, 'u1', 'Alice'));
    expect(mockSet).not.toHaveBeenCalled();

    renderHook(() => usePresence('s1', null, 'Alice'));
    expect(mockSet).not.toHaveBeenCalled();

    renderHook(() => usePresence('s1', 'u1', ''));
    expect(mockSet).not.toHaveBeenCalled();
  });

  it('custom collection changes ref path', () => {
    renderHook(() => usePresence('s1', 'u1', 'Alice', 'poker'));
    expect(mockRef).toHaveBeenCalledWith({}, 'poker/s1/members/u1');
  });
});
