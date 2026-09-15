import { describe, it, expect } from 'vitest';
import { web1PublicTheme } from './public';

describe('Web 1 Public Theme Tokens', () => {
  it('has valid primary, secondary, and background color tokens', () => {
    expect(web1PublicTheme.colors.primary.default).toBe('#0652CC');
    expect(web1PublicTheme.colors.secondary.default).toBe('#091E42');
    expect(web1PublicTheme.colors.background.main).toBe('#FFFFFF');
    expect(web1PublicTheme.colors.surface.card).toBe('#FFFFFF');
  });

  it('provides complete status badge colors', () => {
    expect(web1PublicTheme.colors.status.success.dot).toBe('#10B981');
    expect(web1PublicTheme.colors.status.warning.dot).toBe('#F59E0B');
    expect(web1PublicTheme.colors.status.error.dot).toBe('#EF4444');
    expect(web1PublicTheme.colors.status.info.dot).toBe('#0652CC');
  });
});
