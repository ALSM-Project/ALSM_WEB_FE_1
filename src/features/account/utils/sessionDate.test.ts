import { describe, expect, it } from 'vitest';
import { formatSessionLastActive, formatSessionTimestamp } from './sessionDate';

describe('session date formatters', () => {
  const now = Date.UTC(2026, 8, 15, 12, 0, 0);

  it('formats recent session activity in a human-friendly way', () => {
    expect(formatSessionLastActive(new Date(now - 60_000).toISOString(), now)).toBe('1 minute ago');
    expect(formatSessionLastActive(new Date(now - 5 * 60_000).toISOString(), now)).toBe('5 minutes ago');
    expect(formatSessionLastActive(new Date(now - 3_600_000).toISOString(), now)).toBe('1 hour ago');
    expect(formatSessionLastActive(new Date(now - 2 * 3_600_000).toISOString(), now)).toBe('2 hours ago');
    expect(formatSessionLastActive(new Date(now - 86_400_000).toISOString(), now)).toBe('1 day ago');
    expect(formatSessionLastActive(new Date(now - 2 * 86_400_000).toISOString(), now)).toBe('2 days ago');
  });

  it('handles invalid timestamps without throwing', () => {
    expect(formatSessionLastActive('not-a-date', now)).toBe('Unavailable');
    expect(formatSessionTimestamp('not-a-date')).toBeUndefined();
  });
});
