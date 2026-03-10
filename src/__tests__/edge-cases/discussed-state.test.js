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

describe('EDGE #5: Discussed state lost on refresh', () => {
  let metaCallback;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('retro_host_s1');
    mockOnValue.mockImplementation((refObj, cb) => {
      if (refObj._path?.includes('/meta')) metaCallback = cb;
      return vi.fn();
    });
  });

  const snap = (data) => ({ val: () => data, exists: () => data != null });

  it('phase state comes from Firebase meta, not local state', () => {
    // The "discussed" state of individual cards is managed locally
    // in component state, not persisted to Firebase.
    // When a user refreshes during discuss phase, they lose which
    // cards were marked as discussed.
    // This test documents that session phase IS persisted but
    // card-level discussed state is NOT part of the hooks/Firebase model.
    const { result } = renderHook(() => useSession('s1', 'u1'));
    act(() => {
      metaCallback(snap({ phase: 'discuss', hostId: 'u1' }));
    });

    // Phase is correctly restored from Firebase
    expect(result.current.meta.phase).toBe('discuss');
    // But there's no "discussed cards" tracking in the session hook
    // — that state lives only in component-level state
  });
});
