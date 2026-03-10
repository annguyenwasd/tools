import { describe, it, expect } from 'vitest';
import { parseCSV } from '../csvParser';

describe('parseCSV', () => {
  it('parses standard Rally CSV with all 4 columns', () => {
    const csv = 'FormattedID,Name,Description,PlanEstimate\nUS1,Login,Build login,5\nUS2,Signup,Build signup,8';
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      formattedId: 'US1',
      name: 'Login',
      description: 'Build login',
      planEstimate: '5',
    });
    expect(result[1]).toEqual({
      formattedId: 'US2',
      name: 'Signup',
      description: 'Build signup',
      planEstimate: '8',
    });
  });

  it('parses CSV with only Name column (minimum viable)', () => {
    const csv = 'Name\nLogin\nSignup';
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ formattedId: '', name: 'Login', description: '', planEstimate: '' });
  });

  it('throws when Name column is missing', () => {
    const csv = 'FormattedID,Description\nUS1,desc';
    expect(() => parseCSV(csv)).toThrow('No "Name" column detected in CSV');
  });

  it('returns empty array for empty file', () => {
    expect(parseCSV('')).toEqual([]);
  });

  it('returns empty array for headers-only', () => {
    expect(parseCSV('FormattedID,Name,Description\n')).toEqual([]);
  });

  it('handles quoted fields with commas', () => {
    const csv = 'Name,Description\n"Login, Signup","A, B"';
    const result = parseCSV(csv);
    expect(result[0].name).toBe('Login, Signup');
    expect(result[0].description).toBe('A, B');
  });

  it('handles escaped quotes in quoted fields', () => {
    const csv = 'Name\n"Say ""hello"""';
    const result = parseCSV(csv);
    expect(result[0].name).toBe('Say "hello"');
  });

  it('BUG DOC: quoted fields with newlines break parser (splits on \\n first)', () => {
    const csv = 'Name,Description\n"Story","Line1\nLine2"';
    // The parser splits on \n first, so the quoted newline breaks it
    const result = parseCSV(csv);
    // Instead of 1 row, we get unexpected results because line2" is parsed as a separate row
    // This documents the known limitation
    expect(result.length).not.toBe(1);
  });

  it('handles case-insensitive headers', () => {
    const csv = 'FORMATTEDID,NAME,DESCRIPTION,PLANESTIMATE\nUS1,Login,desc,5';
    const result = parseCSV(csv);
    expect(result[0]).toEqual({ formattedId: 'US1', name: 'Login', description: 'desc', planEstimate: '5' });
  });

  it('strips whitespace from headers', () => {
    const csv = ' Formatted ID , Name , Description \nUS1,Login,desc';
    const result = parseCSV(csv);
    expect(result[0].formattedId).toBe('US1');
    expect(result[0].name).toBe('Login');
  });

  it('skips rows with empty name', () => {
    const csv = 'Name\nLogin\n\nSignup';
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Login');
    expect(result[1].name).toBe('Signup');
  });

  it('handles CRLF line endings', () => {
    const csv = 'Name\r\nLogin\r\nSignup';
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
  });

  it('handles CR line endings', () => {
    const csv = 'Name\rLogin\rSignup';
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
  });

  it('ignores extra columns', () => {
    const csv = 'Name,Extra1,Extra2\nLogin,foo,bar';
    const result = parseCSV(csv);
    expect(result[0]).toEqual({ formattedId: '', name: 'Login', description: '', planEstimate: '' });
  });

  it('trims field values', () => {
    const csv = 'Name, Description\n  Login  ,  desc  ';
    const result = parseCSV(csv);
    expect(result[0].name).toBe('Login');
    expect(result[0].description).toBe('desc');
  });
});
