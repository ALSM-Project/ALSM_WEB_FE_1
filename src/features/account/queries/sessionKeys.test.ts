import { describe, expect, it } from 'vitest';
import { sessionKeys } from './sessionKeys';

describe('sessionKeys', () => {
  it('partitions session cache entries by authenticated user ID', () => {
    expect(sessionKeys.byUser('user-a')).toEqual(['sessions', 'user-a']);
    expect(sessionKeys.byUser('user-b')).toEqual(['sessions', 'user-b']);
    expect(sessionKeys.byUser('user-a')).not.toEqual(sessionKeys.byUser('user-b'));
  });
});
