import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CodeViewer } from './CodeViewer';

describe('CodeViewer', () => {
  it('highlights only the real line range supplied by a finding location', () => {
    render(
      <CodeViewer
        code={'first\nsecond\nthird\nfourth'}
        filename="Payment.java"
        highlightStartLine={2}
        highlightEndLine={3}
      />,
    );

    const rows = screen.getAllByRole('row');
    expect(rows[0]).not.toHaveAttribute('data-highlighted');
    expect(rows[1]).toHaveAttribute('data-highlighted', 'true');
    expect(rows[2]).toHaveAttribute('data-highlighted', 'true');
    expect(rows[3]).not.toHaveAttribute('data-highlighted');
  });
});
