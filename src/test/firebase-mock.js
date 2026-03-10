/**
 * Shared Firebase mock for all tests.
 *
 * Usage in test files:
 *   vi.mock('firebase/database', () => import('../test/firebase-mock.js'));
 *   vi.mock('../firebase', () => ({ db: {} }));
 */

const listeners = new Map();

export const db = {};

export function ref(_db, path) {
  return { _path: path, toString: () => path };
}

export function onValue(refObj, callback) {
  const path = refObj._path || refObj.toString();
  if (!listeners.has(path)) listeners.set(path, new Set());
  listeners.get(path).add(callback);
  return () => listeners.get(path)?.delete(callback);
}

export function set(...args) {
  return Promise.resolve();
}

export function update(...args) {
  return Promise.resolve();
}

export function remove(...args) {
  return Promise.resolve();
}

export function push(refObj, data) {
  const key = `pushed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  return { key, _path: `${refObj._path}/${key}` };
}

export function get(refObj) {
  return Promise.resolve({
    val: () => null,
    exists: () => false,
  });
}

export function onDisconnect(refObj) {
  return {
    update: vi.fn(() => Promise.resolve()),
    set: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
  };
}

export function serverTimestamp() {
  return Date.now();
}

export function connectDatabaseEmulator() {}

/**
 * Helper: trigger onValue callbacks for a given path with mock data.
 */
export function simulateSnapshot(path, data) {
  const cbs = listeners.get(path);
  if (!cbs) return;
  const snap = {
    val: () => data,
    exists: () => data != null,
  };
  for (const cb of cbs) cb(snap);
}

/**
 * Reset all listeners between tests.
 */
export function resetListeners() {
  listeners.clear();
}
