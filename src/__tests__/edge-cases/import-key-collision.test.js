import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockOnValue = vi.fn();
const mockUpdate = vi.fn(() => Promise.resolve());
const mockRef = vi.fn((_db, path) => ({ _path: path }));

vi.mock('firebase/database', () => ({
  ref: (...args) => mockRef(...args),
  onValue: (...args) => mockOnValue(...args),
  update: (...args) => mockUpdate(...args),
  set: vi.fn(() => Promise.resolve()),
  remove: vi.fn(() => Promise.resolve()),
  push: vi.fn(),
}));

vi.mock('../../firebase', () => ({ db: {} }));

import { usePokerVoting } from '../../hooks/poker/usePokerVoting';

describe('EDGE #8: Import key collision with same Date.now()', () => {
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

  it('keys include index to avoid collision within same millisecond', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(12345);

    const { result } = renderHook(() => usePokerVoting('s1', null));
    act(() => storiesCallback(snap({})));

    await act(async () => {
      await result.current.importStories([
        { name: 'A' },
        { name: 'B' },
        { name: 'C' },
      ]);
    });

    const updateCall = mockUpdate.mock.calls[0];
    const keys = Object.keys(updateCall[1]);

    // All keys should be unique even though Date.now() returns the same value
    expect(new Set(keys).size).toBe(3);
    expect(keys).toEqual(['imported_12345_0', 'imported_12345_1', 'imported_12345_2']);

    vi.spyOn(Date, 'now').mockRestore();
  });
});
