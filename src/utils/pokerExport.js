function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function sortedStories(stories) {
  return Object.values(stories).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function exportPokerCSV(stories) {
  const rows = [['FormattedID', 'Name', 'Description', 'PlanEstimate']];
  for (const s of sortedStories(stories)) {
    rows.push([s.formattedId, s.name, s.description, s.finalEstimate].map((v) => {
      const val = v ?? '';
      return val.includes(',') || val.includes('"') || val.includes('\n')
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }));
  }
  const csv = rows.map((r) => r.join(',')).join('\r\n');
  downloadBlob(new Blob([csv], { type: 'text/csv' }), 'poker-estimates.csv');
}

export function exportPokerMarkdown(stories) {
  const lines = [
    '# Planning Poker Estimates\n',
    '| ID | Story | Estimate |',
    '|----|-------|----------|',
  ];
  for (const s of sortedStories(stories)) {
    lines.push(`| ${s.formattedId || '—'} | ${s.name} | ${s.finalEstimate || '—'} |`);
  }
  downloadBlob(new Blob([lines.join('\n')], { type: 'text/markdown' }), 'poker-estimates.md');
}

export function exportPokerJSON(stories) {
  const data = sortedStories(stories).map(({ formattedId, name, description, finalEstimate }) => ({
    formattedId, name, description, finalEstimate,
  }));
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'poker-estimates.json');
}
