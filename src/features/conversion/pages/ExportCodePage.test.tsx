import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { LegacyScreen } from '@/features/screens/types/screen';
import { ExportCodePage } from './ExportCodePage';

// conversionService.getScreens now hits the real backend — mock it here rather than
// relying on a fake fallback in the service itself (that would just reintroduce the
// "silently show stale data" problem this app has been moving away from).
const mocks = vi.hoisted(() => {
  const mockScreens: LegacyScreen[] = [
    {
      id: 'scr-login',
      projectId: 'proj-acme',
      name: 'LoginScreen.bms',
      sourceType: 'BMS',
      status: 'Completed',
      framework: 'React',
      lastUpdated: '1 day ago',
    },
    {
      id: 'scr-dashboard',
      projectId: 'proj-acme',
      name: 'Dashboard.bms',
      sourceType: 'BMS',
      status: 'Processing',
      framework: 'React',
      lastUpdated: '10 mins ago',
    },
    {
      id: 'scr-cobol',
      projectId: 'proj-acme',
      name: 'CBACT01C.cbl',
      sourceType: 'COBOL',
      status: 'Completed',
      framework: 'React',
      lastUpdated: '1 day ago',
    },
  ];
  return { getScreens: vi.fn().mockResolvedValue(mockScreens) };
});

vi.mock('../services/conversion.service', () => ({
  conversionService: { getScreens: mocks.getScreens },
}));

describe('ExportCodePage', () => {
  const renderWithRouter = (initialRoute = '/projects/proj-acme/export') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/projects/:projectId/export" element={<ExportCodePage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders the Export Code Package heading and initial configuration', async () => {
    renderWithRouter();

    expect(await screen.findByRole('heading', { name: /Export Code Package/i })).toBeInTheDocument();
    expect(screen.getByText(/Ready to Export/i)).toBeInTheDocument();
    expect(screen.getByText(/Full Project Scaffold/i)).toBeInTheDocument();
    expect(screen.getByText(/Standalone Component Files/i)).toBeInTheDocument();
    expect(screen.getByText(/Storybook Design System/i)).toBeInTheDocument();
  });

  it('switches between output formats and updates selection', async () => {
    renderWithRouter();

    await screen.findByRole('heading', { name: /Export Code Package/i });
    const standaloneOption = screen.getByText(/Standalone Component Files/i);
    fireEvent.click(standaloneOption);

    // Verify standalone radio is selected
    const radioInputs = screen.getAllByRole('radio');
    const standaloneRadio = radioInputs[1] as HTMLInputElement;
    expect(standaloneRadio.checked).toBe(true);
  });

  it('allows clearing all screens and disables the download button', async () => {
    renderWithRouter();

    await screen.findByRole('heading', { name: /Export Code Package/i });

    const clearButton = screen.getByRole('button', { name: /Clear/i });
    fireEvent.click(clearButton);

    expect(screen.getByText(/Please select at least one screen to export/i)).toBeInTheDocument();

    const downloadButtons = screen.getAllByRole('button', { name: /Generate & Download Bundle/i });
    downloadButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  // UC-30: a completed COBOL screen must be selectable for export just like a BMS one -
  // the export pipeline no longer silently drops its Java output, so it must not be
  // excluded from screen selection either.
  it('shows a completed COBOL screen as selectable, not excluded from export', async () => {
    renderWithRouter();

    const cobolRow = await screen.findByText('CBACT01C.cbl');
    expect(cobolRow).toBeInTheDocument();
    expect(screen.getByText('COBOL')).toBeInTheDocument();

    const selectReadyBtn = screen.getByRole('button', { name: /Select Ready/i });
    fireEvent.click(selectReadyBtn);

    expect(screen.getByText(/SCREEN SELECTION \(2\/3\)/i)).toBeInTheDocument();
  });

  it('allows selecting ready screens', async () => {
    renderWithRouter();

    await screen.findByRole('heading', { name: /Export Code Package/i });

    const selectReadyBtn = screen.getByRole('button', { name: /Select Ready/i });
    fireEvent.click(selectReadyBtn);

    const downloadButtons = screen.getAllByRole('button', { name: /Generate & Download Bundle/i });
    downloadButtons.forEach((btn) => {
      expect(btn).not.toBeDisabled();
    });
  });
});
