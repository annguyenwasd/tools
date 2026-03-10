import { describe, it, expect } from 'vitest';
import { parseCSV } from '../../utils/csvParser';

describe('EDGE #9: Aggressive whitespace stripping in CSV headers', () => {
  it('strips all whitespace from headers including internal spaces', () => {
    // "Formatted ID" becomes "formattedid" after trim + toLowerCase + replace(/\s+/g, '')
    // This is aggressive but intentional to match Rally's "FormattedID" format
    const csv = ' Formatted ID , Plan Estimate , Name \nUS1,5,Login';
    const result = parseCSV(csv);

    expect(result[0].formattedId).toBe('US1');
    expect(result[0].planEstimate).toBe('5');
    expect(result[0].name).toBe('Login');
  });
});
