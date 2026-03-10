import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportPokerCSV, exportPokerMarkdown, exportPokerJSON } from '../pokerExport';

// Mock URL.createObjectURL and DOM
let lastBlobContent;
let lastFilename;

beforeEach(() => {
  lastBlobContent = null;
  lastFilename = null;
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock'),
    revokeObjectURL: vi.fn(),
  });
  vi.spyOn(document, 'createElement').mockReturnValue({
    href: '',
    download: '',
    click: vi.fn(),
    set href(v) { this._href = v; },
    get href() { return this._href; },
  });
});

function captureBlob(fn, stories) {
  const origCreate = Blob;
  let captured = null;
  vi.stubGlobal('Blob', class extends origCreate {
    constructor(parts, opts) {
      super(parts, opts);
      captured = parts[0];
    }
  });
  fn(stories);
  vi.stubGlobal('Blob', origCreate);
  return captured;
}

const sampleStories = {
  s1: { formattedId: 'US1', name: 'Login', description: 'Build login', finalEstimate: '5', order: 1 },
  s2: { formattedId: 'US2', name: 'Signup', description: 'Build signup', finalEstimate: '8', order: 0 },
};

describe('exportPokerCSV', () => {
  it('produces Rally-compatible header', () => {
    const csv = captureBlob(exportPokerCSV, sampleStories);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('FormattedID,Name,Description,PlanEstimate');
  });

  it('uses CRLF line endings', () => {
    const csv = captureBlob(exportPokerCSV, sampleStories);
    expect(csv).toContain('\r\n');
  });

  it('sorts stories by order', () => {
    const csv = captureBlob(exportPokerCSV, sampleStories);
    const lines = csv.split('\r\n');
    // order 0 (Signup) should come before order 1 (Login)
    expect(lines[1]).toContain('Signup');
    expect(lines[2]).toContain('Login');
  });

  it('escapes commas and quotes in fields', () => {
    const stories = {
      s1: { formattedId: '', name: 'Story, with comma', description: 'Has "quotes"', finalEstimate: '3', order: 0 },
    };
    const csv = captureBlob(exportPokerCSV, stories);
    expect(csv).toContain('"Story, with comma"');
    expect(csv).toContain('"Has ""quotes"""');
  });

  it('handles empty stories without crash', () => {
    expect(() => captureBlob(exportPokerCSV, {})).not.toThrow();
    const csv = captureBlob(exportPokerCSV, {});
    expect(csv).toBe('FormattedID,Name,Description,PlanEstimate');
  });
});

describe('exportPokerMarkdown', () => {
  it('produces valid markdown table', () => {
    const md = captureBlob(exportPokerMarkdown, sampleStories);
    expect(md).toContain('| ID | Story | Estimate |');
    expect(md).toContain('|----|-------|----------|');
  });

  it('uses em-dash for missing values', () => {
    const stories = {
      s1: { name: 'Story', order: 0 },
    };
    const md = captureBlob(exportPokerMarkdown, stories);
    expect(md).toContain('—');
  });

  it('sorts by order', () => {
    const md = captureBlob(exportPokerMarkdown, sampleStories);
    const signupIdx = md.indexOf('Signup');
    const loginIdx = md.indexOf('Login');
    expect(signupIdx).toBeLessThan(loginIdx);
  });
});

describe('exportPokerJSON', () => {
  it('produces correct shape', () => {
    const json = captureBlob(exportPokerJSON, sampleStories);
    const data = JSON.parse(json);
    expect(data).toHaveLength(2);
    expect(data[0]).toHaveProperty('formattedId');
    expect(data[0]).toHaveProperty('name');
    expect(data[0]).toHaveProperty('description');
    expect(data[0]).toHaveProperty('finalEstimate');
  });

  it('sorts by order', () => {
    const json = captureBlob(exportPokerJSON, sampleStories);
    const data = JSON.parse(json);
    expect(data[0].name).toBe('Signup');
    expect(data[1].name).toBe('Login');
  });

  it('handles empty stories', () => {
    const json = captureBlob(exportPokerJSON, {});
    expect(JSON.parse(json)).toEqual([]);
  });
});
