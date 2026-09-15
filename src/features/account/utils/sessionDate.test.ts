import { describe, expect, it } from 'vitest';
import { formatSessionLastActive, formatSessionTimestamp } from './sessionDate';

describe('session date formatters', () => {
  const utcTimestamp = '2026-09-15T11:09:27.000Z';

  it('converts UTC to a dd/MM/yyyy 24-hour Vietnam-local timestamp', () => {
    expect(formatSessionLastActive(utcTimestamp)).toBe('15/09/2026 18:09');
    expect(formatSessionTimestamp(utcTimestamp)).toBe('15/09/2026 18:09:27 (GMT+7)');
  });

  it('handles invalid timestamps without throwing', () => {
    expect(formatSessionLastActive('not-a-date')).toBe('Unavailable');
    expect(formatSessionTimestamp('not-a-date')).toBeUndefined();
  });
});
