import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
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
  return {
    getScreens: vi.fn().mockResolvedValue(mockScreens),
    getProjectById: vi.fn().mockResolvedValue(null),
  };
});

vi.mock('../services/conversion.service', () => ({
  conversionService: { getScreens: mocks.getScreens },
}));

vi.mock('@/features/projects/services/project.service', () => ({
  projectService: { getProjectById: mocks.getProjectById },
}));

const baseProject = {
  id: 'proj-acme',
  name: 'Acme',
  status: 'ACTIVE',
  createdAt: '',
  updatedAt: '',
};

describe('ExportCodePage', () => {
  beforeEach(() => {
    mocks.getProjectById.mockResolvedValue(null);
  });

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

  describe('per conversion type', () => {
    it('shows React options and wording for a BMS/DSPF project', async () => {
      mocks.getProjectById.mockResolvedValue({ ...baseProject, conversionType: 'BMS_DSPF_TO_FRONTEND' });
      renderWithRouter();

      expect(await screen.findByText(/Full Project Scaffold/i)).toBeInTheDocument();
      expect(screen.getByText(/Target Framework Version/i)).toBeInTheDocument();
      expect(screen.getByText(/Vitest & RTL/i)).toBeInTheDocument();
      expect(screen.getByText(/SCREEN SELECTION/i)).toBeInTheDocument();
      expect(screen.getAllByText(/React 19/).length).toBeGreaterThan(0);
      expect(screen.queryByText(/Java Source Package/i)).not.toBeInTheDocument();
    });

    it('shows a Java-only page for a COBOL -> Java project: no React/Tailwind/Vitest/Storybook options', async () => {
      mocks.getProjectById.mockResolvedValue({ ...baseProject, conversionType: 'COBOL_TO_JAVA' });
      renderWithRouter();

      expect(await screen.findByText(/Java Source Package/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(/Spring Batch \(tool2java output\)/i)).toBeInTheDocument();
      expect(screen.getByText(/PROGRAM SELECTION/i)).toBeInTheDocument();
      expect(screen.getByText(/Java \/ Spring Batch/i)).toBeInTheDocument();

      expect(screen.queryByText(/Full Project Scaffold/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Standalone Component Files/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Storybook Design System/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Target Framework Version/i)).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue(/Tailwind/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Tailwind/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Vitest/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/React 1[89]/)).not.toBeInTheDocument();
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    });

    it('uses program wording when clearing the selection of a COBOL project', async () => {
      mocks.getProjectById.mockResolvedValue({ ...baseProject, conversionType: 'COBOL_TO_JAVA' });
      renderWithRouter();

      await screen.findByText(/Java Source Package/i);
      fireEvent.click(screen.getByRole('button', { name: /Clear/i }));
      expect(screen.getByText(/Please select at least one program to export/i)).toBeInTheDocument();
    });
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
