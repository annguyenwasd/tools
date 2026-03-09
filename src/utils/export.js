export function exportJSON(cards, meta) {
  const data = { meta, cards };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, 'retrospective.json');
}

export function exportMarkdown(cards, categories) {
  const lines = ['# Sprint Retrospective\n'];
  for (const category of categories) {
    lines.push(`## ${category}\n`);
    lines.push('| # | Card | Votes |');
    lines.push('|---|------|-------|');
    const catCards = Object.values(cards)
      .filter((c) => c.category === category)
      .sort((a, b) => (b.votes || 0) - (a.votes || 0));
    catCards.forEach((card, i) => {
      lines.push(`| ${i + 1} | ${card.content} | ${card.votes || 0} |`);
    });
    lines.push('');
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  downloadBlob(blob, 'retrospective.md');
}

export function exportConfluence(cards, categories) {
  const lines = ['h1. Sprint Retrospective\n'];
  for (const category of categories) {
    lines.push(`h2. ${category}\n`);
    lines.push('|| # || Card || Votes ||');
    const catCards = Object.values(cards)
      .filter((c) => c.category === category)
      .sort((a, b) => (b.votes || 0) - (a.votes || 0));
    catCards.forEach((card, i) => {
      lines.push(`| ${i + 1} | ${card.content} | ${card.votes || 0} |`);
    });
    lines.push('');
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  downloadBlob(blob, 'retrospective.confluence.txt');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
