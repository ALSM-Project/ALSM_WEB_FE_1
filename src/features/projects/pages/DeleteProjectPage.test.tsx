import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DeleteProjectPage } from './DeleteProjectPage';

describe('DeleteProjectPage', () => {
  const renderWithRouter = (initialRoute = '/projects/proj-mortgage/delete') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/projects/:projectId/delete" element={<DeleteProjectPage />} />
          <Route path="/projects" element={<div>Projects List Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders Delete Modernization Project heading and confirmation input', async () => {
    renderWithRouter();

    expect(await screen.findByRole('heading', { name: /Delete Modernization Project\?/i })).toBeInTheDocument();
    expect(screen.getByText(/This project will be soft-deleted and can be recovered within 30 days/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Type project name to confirm/i)).toBeInTheDocument();
  });

  it('disables Delete Project button until exact project name is entered', async () => {
    renderWithRouter();

    await screen.findByRole('heading', { name: /Delete Modernization Project\?/i });

    const deleteBtn = screen.getByRole('button', { name: /Delete Project/i });
    expect(deleteBtn).toBeDisabled();

    const input = screen.getByLabelText(/Type project name to confirm/i);
    fireEvent.change(input, { target: { value: 'WrongName' } });
    expect(deleteBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: 'Mortgage-System-v1' } });
    expect(deleteBtn).not.toBeDisabled();
  });

  it('executes project deletion and shows success feedback when confirmed', async () => {
    renderWithRouter();

    await screen.findByRole('heading', { name: /Delete Modernization Project\?/i });

    const input = screen.getByLabelText(/Type project name to confirm/i);
    fireEvent.change(input, { target: { value: 'Mortgage-System-v1' } });

    const deleteBtn = screen.getByRole('button', { name: /Delete Project/i });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByText(/was soft-deleted successfully/i)).toBeInTheDocument();
    });
  });
});
