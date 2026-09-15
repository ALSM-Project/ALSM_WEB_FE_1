import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TrialActivationPage } from './TrialActivationPage';

describe('TrialActivationPage', () => {
  const renderWithRouter = (initialRoute = '/billing/trial') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/billing/trial" element={<TrialActivationPage />} />
          <Route path="/projects/:projectId/screens" element={<div>Screens List Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders heading, badge, feature bullets, and timeline steps', async () => {
    renderWithRouter();

    expect(await screen.findByRole('heading', { name: /Activate Your Trial/i })).toBeInTheDocument();
    expect(screen.getByText(/Professional Trial — \$0 Due Today/i)).toBeInTheDocument();
    expect(screen.getByText(/Unlimited Projects/i)).toBeInTheDocument();
    expect(screen.getByText(/100 Screens\/mo/i)).toBeInTheDocument();
    expect(screen.getByText(/AI-assisted structural mapping/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Full platform access/i).length).toBeGreaterThan(0);

    expect(screen.getByText('Day 1')).toBeInTheDocument();
    expect(screen.getByText('Day 12')).toBeInTheDocument();
    expect(screen.getByText('Day 14')).toBeInTheDocument();
    expect(screen.getByText(/No credit card required/i)).toBeInTheDocument();
  });

  it('triggers trial activation when Activate Free Trial button is clicked', async () => {
    renderWithRouter();

    await screen.findByRole('heading', { name: /Activate Your Trial/i });

    const activateBtn = screen.getByRole('button', { name: /Activate Free Trial/i });
    fireEvent.click(activateBtn);

    await waitFor(() => {
      expect(screen.getByText(/Trial Activated! Redirecting to Workspace.../i)).toBeInTheDocument();
    });
  });
});
