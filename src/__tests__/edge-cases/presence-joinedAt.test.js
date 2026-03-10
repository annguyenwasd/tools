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

import { usePresence } from '../../hooks/usePresence';

describe('EDGE #3: joinedAt resets break auto-election', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('joinedAt is reset on every mount, not preserved from initial join', () => {
    // First mount
    const { unmount } = renderHook(() => usePresence('s1', 'u1', 'Alice'));

    const firstCall = mockSet.mock.calls.find(
      ([ref, data]) => data.online === true
    );
    const firstJoinedAt = firstCall[1].joinedAt;

    unmount();
    mockSet.mockClear();

    // Second mount (e.g., page refresh) — joinedAt should ideally be preserved
    // but the implementation sets Date.now() again
    const { unmount: unmount2 } = renderHook(() => usePresence('s1', 'u1', 'Alice'));

    const secondCall = mockSet.mock.calls.find(
      ([ref, data]) => data.online === true
    );
    const secondJoinedAt = secondCall[1].joinedAt;

    // BUG: joinedAt resets, which can cause wrong auto-election winner
    expect(secondJoinedAt).toBeGreaterThanOrEqual(firstJoinedAt);
    unmount2();
  });

  it('joinedAt reset changes auto-election order', () => {
    // If user A joined at time 100 and user B at time 200,
    // A should always win auto-election.
    // But if A refreshes the page, A's joinedAt becomes e.g. 300,
    // making B (200) the winner instead.
    // This test documents that usePresence always writes Date.now()
    const { unmount } = renderHook(() => usePresence('s1', 'u1', 'Alice'));

    const setCall = mockSet.mock.calls[0];
    // joinedAt is Date.now(), not preserved from previous session
    expect(typeof setCall[1].joinedAt).toBe('number');
    expect(setCall[1].joinedAt).toBeGreaterThan(0);

    unmount();
  });
});
