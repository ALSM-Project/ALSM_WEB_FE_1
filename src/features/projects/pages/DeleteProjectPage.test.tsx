import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Project } from '../types/project';
import { DeleteProjectPage } from './DeleteProjectPage';

// projectService now hits the real backend — mock it so this test doesn't depend on
// a running server or a valid auth token.
const mocks = vi.hoisted(() => {
  const projects: Project[] = [
    {
      id: 'proj-mortgage',
      name: 'Mortgage-System-v1',
      description: 'Legacy mortgage management system',
      status: 'ACTIVE',
      conversionType: 'BMS_DSPF_TO_FRONTEND',
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: '2026-09-01T10:00:00Z',
    },
  ];
  return {
    getProjects: vi.fn().mockResolvedValue(projects),
    deleteProject: vi.fn().mockResolvedValue(true),
  };
});

vi.mock('../services/project.service', () => ({
  projectService: { getProjects: mocks.getProjects, deleteProject: mocks.deleteProject },
}));

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
