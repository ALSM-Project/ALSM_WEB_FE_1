import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ExportCodePage } from './ExportCodePage';

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
