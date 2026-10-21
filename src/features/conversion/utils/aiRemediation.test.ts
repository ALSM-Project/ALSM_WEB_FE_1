import { describe, it, expect } from 'vitest';
import { extractSuggestionCode, applyAiSuggestion } from './aiRemediation';
import {
  ValidationFindingCategory,
  ValidationFindingSeverity,
  ValidationFindingSource,
  ValidationFindingStatus,
  type ValidationFinding,
} from '../types/validation';

describe('aiRemediation', () => {
  describe('extractSuggestionCode', () => {
    it('extracts snippet from markdown code blocks', () => {
      const suggestion = 'Here is the fix:\n```tsx\n<input id="acctno" maxLength={16} />\n```';
      expect(extractSuggestionCode(suggestion)).toBe('<input id="acctno" maxLength={16} />');
    });

    it('extracts snippet from inline backticks with JSX', () => {
      const suggestion = 'Update to `<span style={{ gridRow: 2 }}>Title</span>`';
      expect(extractSuggestionCode(suggestion)).toBe('<span style={{ gridRow: 2 }}>Title</span>');
    });

    it('extracts raw JSX tags when present', () => {
      const suggestion = 'Update to: <input style={{ gridRow: 8 }} id="cardnum" type="text" maxLength={16} inputMode="numeric" />';
      expect(extractSuggestionCode(suggestion)).toBe(
        '<input style={{ gridRow: 8 }} id="cardnum" type="text" maxLength={16} inputMode="numeric" />'
      );
    });

    it('strips advisory prefixes cleanly', () => {
      const suggestion = 'Update to: inputMode="numeric"';
      expect(extractSuggestionCode(suggestion)).toBe('inputMode="numeric"');
    });
  });

  describe('applyAiSuggestion', () => {
    const baseCode = `import React from 'react';

export const Screen = () => {
  return (
    <div className="grid grid-cols-80">
      <span style={{ gridRow: 1, gridColumn: '1 / span 10' }}>Old Title</span>
      <input id="cardnum" maxLength={10} />
    </div>
  );
};`;

    it('replaces target lines when targetLocation is specified', () => {
      const finding: ValidationFinding = {
        id: 'f-1',
        organizationId: 'org-1',
        projectId: 'proj-1',
        conversionJobId: 'job-1',
        validationRunId: 'run-1',
        source: ValidationFindingSource.AI,
        category: ValidationFindingCategory.LAYOUT_DISCREPANCY,
        severity: ValidationFindingSeverity.HIGH,
        status: ValidationFindingStatus.PENDING,
        title: 'Title location mismatch',
        explanation: 'Line 6 has old position',
        suggestion: 'Update to: <span style={{ gridRow: 1, gridColumn: "2 / span 20" }}>New Title</span>',
        targetLocation: { file: 'Screen.tsx', startLine: 6, endLine: 6 },
        createdAt: '2026-10-19T00:00:00Z',
        updatedAt: '2026-10-19T00:00:00Z',
      };

      const result = applyAiSuggestion(baseCode, finding);
      expect(result).toContain('<span style={{ gridRow: 1, gridColumn: "2 / span 20" }}>New Title</span>');
      expect(result).not.toContain('Old Title');
    });

    it('replaces by fieldName match when line number is absent', () => {
      const finding: ValidationFinding = {
        id: 'f-2',
        organizationId: 'org-1',
        projectId: 'proj-1',
        conversionJobId: 'job-1',
        validationRunId: 'run-1',
        source: ValidationFindingSource.AI,
        category: ValidationFindingCategory.ATTRIBUTE_MISMATCH,
        severity: ValidationFindingSeverity.MEDIUM,
        status: ValidationFindingStatus.PENDING,
        title: '[ATTRIBUTE_MISMATCH] CARDNUM',
        explanation: 'CARDNUM should have maxLength={16} and inputMode="numeric"',
        suggestion: '<input id="cardnum" maxLength={16} inputMode="numeric" />',
        createdAt: '2026-10-19T00:00:00Z',
        updatedAt: '2026-10-19T00:00:00Z',
      };

      const result = applyAiSuggestion(baseCode, finding);
      expect(result).toContain('<input id="cardnum" maxLength={16} inputMode="numeric" />');
      expect(result).not.toContain('<input id="cardnum" maxLength={10} />');
    });

    it('inserts missing elements before closing container tag for missing field', () => {
      const finding: ValidationFinding = {
        id: 'f-3',
        organizationId: 'org-1',
        projectId: 'proj-1',
        conversionJobId: 'job-1',
        validationRunId: 'run-1',
        source: ValidationFindingSource.AI,
        category: ValidationFindingCategory.MISSING_FIELD,
        severity: ValidationFindingSeverity.HIGH,
        status: ValidationFindingStatus.PENDING,
        title: '[MISSING_FIELD] FOOTER',
        explanation: 'Footer field is missing from React component',
        suggestion: '<span style={{ gridRow: 24, gridColumn: "1 / span 80" }}>F3=Exit</span>',
        createdAt: '2026-10-19T00:00:00Z',
        updatedAt: '2026-10-19T00:00:00Z',
      };

      const result = applyAiSuggestion(baseCode, finding);
      expect(result).toContain('<span style={{ gridRow: 24, gridColumn: "1 / span 80" }}>F3=Exit</span>');
      expect(result).toContain('</div>\n  );\n};');
    });
  });
});
