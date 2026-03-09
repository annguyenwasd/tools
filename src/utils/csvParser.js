/**
 * Rally-compatible CSV parser.
 * Returns [{ formattedId, name, description, planEstimate }]
 */

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

export function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean);
  if (lines.length < 2) return [];

  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map((h) => h.trim().toLowerCase().replace(/\s+/g, ''));

  const idIdx = headers.indexOf('formattedid');
  const nameIdx = headers.indexOf('name');
  const descIdx = headers.indexOf('description');
  const estimateIdx = headers.indexOf('planestimate');

  if (nameIdx === -1) {
    throw new Error('No "Name" column detected in CSV');
  }

  return lines.slice(1).map((line) => {
    const fields = parseCSVLine(line);
    return {
      formattedId: idIdx >= 0 ? fields[idIdx]?.trim() || '' : '',
      name: fields[nameIdx]?.trim() || '',
      description: descIdx >= 0 ? fields[descIdx]?.trim() || '' : '',
      planEstimate: estimateIdx >= 0 ? fields[estimateIdx]?.trim() || '' : '',
    };
  }).filter((row) => row.name);
}
