import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockOnValue = vi.fn();
const mockUpdate = vi.fn(() => Promise.resolve());
const mockSet = vi.fn(() => Promise.resolve());
const mockRemove = vi.fn(() => Promise.resolve());
const mockOnDisconnect = vi.fn(() => ({
  update: vi.fn(() => Promise.resolve()),
}));
const mockRef = vi.fn((_db, path) => ({ _path: path }));

vi.mock('firebase/database', () => ({
  ref: (...args) => mockRef(...args),
  onValue: (...args) => mockOnValue(...args),
  update: (...args) => mockUpdate(...args),
  set: (...args) => mockSet(...args),
  remove: (...args) => mockRemove(...args),
  onDisconnect: (...args) => mockOnDisconnect(...args),
  serverTimestamp: () => 'SERVER_TIMESTAMP',
}));

vi.mock('../../firebase', () => ({ db: {} }));

import { usePresence } from '../../hooks/usePresence';

describe('EDGE #4: Join non-existent session creates orphan data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('usePresence writes member data without checking session exists', () => {
    // If someone navigates to /retro/session/nonexistent,
    // usePresence still writes to sessions/nonexistent/members/userId
    // creating orphan data in Firebase
    renderHook(() => usePresence('nonexistent-session', 'u1', 'Alice'));

    expect(mockSet).toHaveBeenCalledWith(
      { _path: 'sessions/nonexistent-session/members/u1' },
      expect.objectContaining({ name: 'Alice', online: true })
    );
    // No validation that the session actually exists
  });

  it('orphan member data persists after disconnect', () => {
    renderHook(() => usePresence('ghost-session', 'u1', 'Alice'));

    // onDisconnect is registered, so the member entry stays with online: false
    // even though the session never existed
    expect(mockOnDisconnect).toHaveBeenCalledWith(
      { _path: 'sessions/ghost-session/members/u1' }
    );
  });
});
