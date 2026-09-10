import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DiagnosticsPage } from './DiagnosticsPage';

describe('DiagnosticsPage', () => {
  const renderWithRouter = (initialRoute = '/projects/proj-acme/diagnostics') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/projects/:projectId/diagnostics" element={<DiagnosticsPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders heading, status pill badge, search, and action buttons', async () => {
    renderWithRouter();

    expect(await screen.findByRole('heading', { name: /Error Logs & Diagnostics/i })).toBeInTheDocument();
    expect(screen.getByText(/Failed/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search error codes, screens.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download Full Log/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download Log Archive/i })).toBeInTheDocument();
  });

  it('renders log table entries and displays details for selected log', async () => {
    renderWithRouter();

    await screen.findByRole('heading', { name: /Error Logs & Diagnostics/i });

    expect(screen.getByText('ERR_BMS_UNSUPPORTED_MACRO')).toBeInTheDocument();
    expect(screen.getByText('WARN_DEPRECATED_SYSCALL')).toBeInTheDocument();
    expect(screen.getByText('Source Code Snippet')).toBeInTheDocument();
    expect(screen.getByText('AI-Suggested Resolution')).toBeInTheDocument();
  });

  it('switches log selection when a row is clicked', async () => {
    renderWithRouter();

    await screen.findByRole('heading', { name: /Error Logs & Diagnostics/i });

    const secondRowCode = screen.getByText('WARN_DEPRECATED_SYSCALL');
    fireEvent.click(secondRowCode);

    expect(screen.getByText(/CALL 'SYSDAT' USING WS-SYS-DATE/i)).toBeInTheDocument();
  });

  it('filters logs by search input', async () => {
    renderWithRouter();

    await screen.findByRole('heading', { name: /Error Logs & Diagnostics/i });

    const searchInput = screen.getByPlaceholderText(/Search error codes, screens.../i);
    fireEvent.change(searchInput, { target: { value: 'WARN_DEPRECATED' } });

    expect(screen.getByText('WARN_DEPRECATED_SYSCALL')).toBeInTheDocument();
    expect(screen.queryByText('ERR_BMS_UNSUPPORTED_MACRO')).not.toBeInTheDocument();
  });

  it('applies diagnostic patch when Apply Patch button is clicked', async () => {
    renderWithRouter();

    await screen.findByRole('heading', { name: /Error Logs & Diagnostics/i });

    const applyBtn = screen.getByRole('button', { name: /Apply Patch & Retry/i });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(screen.getByText(/Patch Applied & Retried/i)).toBeInTheDocument();
    });
  });
});
