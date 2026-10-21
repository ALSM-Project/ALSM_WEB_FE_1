import { describe, it, expect } from 'vitest';
import { formatExportArchiveName, formatExportFileSize } from './exportHelpers';

describe('exportHelpers', () => {
  it('formats archive name with project name and sanitized chars', () => {
    const name = formatExportArchiveName('Card Demo UI', 'React');
    expect(name).toContain('card_demo_ui_react_');
    expect(name.endsWith('.zip')).toBe(true);
  });

  it('formats file sizes accurately', () => {
    expect(formatExportFileSize(0)).toBe('0 B');
    expect(formatExportFileSize(1024)).toBe('1.0 KB');
    expect(formatExportFileSize(1048576)).toBe('1.0 MB');
  });
});
