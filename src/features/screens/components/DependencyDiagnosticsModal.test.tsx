import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { ProgramAnalysis } from '../types/copybookDependency';
import { DependencyDiagnosticsModal } from './DependencyDiagnosticsModal';

const mocks = vi.hoisted(() => ({ getCopybookDependencies: vi.fn() }));

vi.mock('@/features/conversion/services/conversion.service', () => ({
  conversionService: { getCopybookDependencies: mocks.getCopybookDependencies },
}));

describe('DependencyDiagnosticsModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <DependencyDiagnosticsModal isOpen={false} onClose={vi.fn()} screenId="scr-1" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a READY_FOR_CONVERSION analysis with resolved dependencies', async () => {
    const analysis: ProgramAnalysis = {
      program: 'CBACT01C.cbl',
      status: 'READY_FOR_CONVERSION',
      dependencies: [
        { copyName: 'CVACT01Y', resolvedFile: 'CVACT01Y.cpy', status: 'RESOLVED' },
      ],
    };
    mocks.getCopybookDependencies.mockResolvedValue(analysis);

    render(<DependencyDiagnosticsModal isOpen onClose={vi.fn()} screenId="scr-1" />);

    expect(await screen.findByText('CBACT01C.cbl')).toBeInTheDocument();
    expect(screen.getByText(/Ready for conversion/i)).toBeInTheDocument();
    expect(screen.getByText('CVACT01Y.cpy')).toBeInTheDocument();
    expect(screen.getAllByText('1')[0]).toBeInTheDocument(); // Resolved count tile
  });

  it('shows a BLOCKED analysis with missing and ambiguous dependencies plus correct counts', async () => {
    const analysis: ProgramAnalysis = {
      program: 'CBACT01C.cbl',
      status: 'BLOCKED',
      dependencies: [
        { copyName: 'CVACT01Y', resolvedFile: 'CVACT01Y.cpy', status: 'RESOLVED' },
        {
          copyName: 'ACCTFILE-STATUS',
          status: 'MISSING',
          message: "COPYBOOK 'ACCTFILE-STATUS' referenced by 'CBACT01C.cbl' could not be found.",
        },
        {
          copyName: 'CUSTOMER',
          status: 'AMBIGUOUS',
          candidates: ['CUSTOMER.cpy', 'legacy/CUSTOMER.cpy'],
          message: "COPYBOOK 'CUSTOMER' referenced by 'CBACT01C.cbl' matches multiple files.",
        },
      ],
    };
    mocks.getCopybookDependencies.mockResolvedValue(analysis);

    render(<DependencyDiagnosticsModal isOpen onClose={vi.fn()} screenId="scr-1" />);

    expect(await screen.findByText(/Blocked/i)).toBeInTheDocument();
    expect(screen.getByText('ACCTFILE-STATUS')).toBeInTheDocument();
    expect(screen.getByText(/could not be found/i)).toBeInTheDocument();
    expect(screen.getByText(/matches multiple files/i)).toBeInTheDocument();

    // Summary tiles: Resolved=1, Missing=1, Ambiguous=1, Total=3
    const values = screen.getAllByText(/^[0-9]+$/).map((el) => el.textContent);
    expect(values).toEqual(expect.arrayContaining(['1', '1', '1', '3']));
  });

  it('shows IBM system copybooks as system-provided and treats a legacy BLOCKED-only-by-them program as ready', async () => {
    const analysis: ProgramAnalysis = {
      program: 'COSGN00C.cbl',
      status: 'BLOCKED',
      dependencies: [
        { copyName: 'COCOM01Y', resolvedFile: 'COCOM01Y.cpy', status: 'RESOLVED' },
        {
          copyName: 'DFHAID',
          status: 'SYSTEM_PROVIDED',
          message: "COPYBOOK 'DFHAID' referenced by 'COSGN00C.cbl' is an IBM system copybook (CICS/MQ) supplied by the runtime; it is not expected in the upload.",
        },
        { copyName: 'DFHBMSCA', status: 'MISSING' },
      ],
    };
    mocks.getCopybookDependencies.mockResolvedValue(analysis);

    render(<DependencyDiagnosticsModal isOpen onClose={vi.fn()} screenId="scr-1" />);

    expect(await screen.findByText(/Ready for conversion/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^SYSTEM_PROVIDED/)).toHaveLength(2);
    expect(screen.getByText(/IBM system copybook/i)).toBeInTheDocument();
  });

  it('shows an error message when the request fails', async () => {
    mocks.getCopybookDependencies.mockRejectedValue(new Error('network down'));

    render(<DependencyDiagnosticsModal isOpen onClose={vi.fn()} screenId="scr-1" />);

    expect(await screen.findByText(/Could not load dependency diagnostics/i)).toBeInTheDocument();
  });
});
