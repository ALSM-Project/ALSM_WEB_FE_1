import { describe, it, expect } from 'vitest';
import { formatExportArchiveName } from '../utils/exportHelpers';
import { extractSuggestionCode } from '../utils/aiRemediation';

describe('ModernizationWorkflowProgression', () => {
  it('extracts remediation code and prepares export file metadata correctly', () => {
    const rawSuggestion = '```tsx\n<Button variant="primary">Submit</Button>\n```';
    const code = extractSuggestionCode(rawSuggestion);
    expect(code).toBe('<Button variant="primary">Submit</Button>');

    const archive = formatExportArchiveName('CardDemo', 'React');
    expect(archive).toMatch(/^carddemo_react_\d{4}-\d{2}-\d{2}\.zip$/);
  });
});
