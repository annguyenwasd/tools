import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportJSON, exportMarkdown, exportConfluence } from '../export';

let lastBlobContent;

beforeEach(() => {
  lastBlobContent = null;
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock'),
    revokeObjectURL: vi.fn(),
  });
  vi.spyOn(document, 'createElement').mockReturnValue({
    href: '',
    download: '',
    click: vi.fn(),
  });
});

function captureBlob(fn, ...args) {
  const origCreate = Blob;
  let captured = null;
  vi.stubGlobal('Blob', class extends origCreate {
    constructor(parts, opts) {
      super(parts, opts);
      captured = parts[0];
    }
  });
  fn(...args);
  vi.stubGlobal('Blob', origCreate);
  return captured;
}

const cards = {
  c1: { content: 'Good teamwork', category: 'Went Well', votes: 3 },
  c2: { content: 'Fast deploys', category: 'Went Well', votes: 1 },
  c3: { content: 'Slow reviews', category: 'To Improve', votes: 2 },
};
const categories = ['Went Well', 'To Improve'];
const meta = { phase: 'export', hostId: 'h1' };

describe('exportJSON', () => {
  it('includes meta and cards', () => {
    const json = captureBlob(exportJSON, cards, meta);
    const data = JSON.parse(json);
    expect(data.meta).toEqual(meta);
    expect(data.cards).toEqual(cards);
  });
});

describe('exportMarkdown', () => {
  it('groups by category', () => {
    const md = captureBlob(exportMarkdown, cards, categories);
    expect(md).toContain('## Went Well');
    expect(md).toContain('## To Improve');
  });

  it('sorts by votes descending', () => {
    const md = captureBlob(exportMarkdown, cards, categories);
    const wentWellSection = md.split('## To Improve')[0];
    const goodIdx = wentWellSection.indexOf('Good teamwork');
    const fastIdx = wentWellSection.indexOf('Fast deploys');
    expect(goodIdx).toBeLessThan(fastIdx);
  });

  it('defaults votes to 0', () => {
    const noVoteCards = { c1: { content: 'Test', category: 'Cat1' } };
    const md = captureBlob(exportMarkdown, noVoteCards, ['Cat1']);
    expect(md).toContain('| 0 |');
  });

  it('handles empty cards', () => {
    const md = captureBlob(exportMarkdown, {}, ['Cat1']);
    expect(md).toContain('## Cat1');
  });
});

describe('exportConfluence', () => {
  it('uses wiki markup syntax', () => {
    const confluence = captureBlob(exportConfluence, cards, categories);
    expect(confluence).toContain('h1. Sprint Retrospective');
    expect(confluence).toContain('h2. Went Well');
    expect(confluence).toContain('|| # || Card || Votes ||');
  });

  it('sorts by votes descending', () => {
    const confluence = captureBlob(exportConfluence, cards, categories);
    const wentWellSection = confluence.split('h2. To Improve')[0];
    const goodIdx = wentWellSection.indexOf('Good teamwork');
    const fastIdx = wentWellSection.indexOf('Fast deploys');
    expect(goodIdx).toBeLessThan(fastIdx);
  });

  it('handles empty cards', () => {
    const confluence = captureBlob(exportConfluence, {}, ['Cat1']);
    expect(confluence).toContain('h2. Cat1');
  });

  it('handles empty categories', () => {
    expect(() => captureBlob(exportConfluence, {}, [])).not.toThrow();
  });
});
