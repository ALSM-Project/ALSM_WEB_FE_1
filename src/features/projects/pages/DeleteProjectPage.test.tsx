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
    getProject: vi.fn().mockResolvedValue(projects[0]),
    deleteProject: vi.fn().mockResolvedValue(true),
  };
});

vi.mock('../services/project.service', () => ({
  projectService: {
    getProjects: mocks.getProjects,
    getProject: mocks.getProject,
    getProjectById: mocks.getProject,
    deleteProject: mocks.deleteProject,
  },
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
    expect(screen.getByText(/This project will be soft-deleted/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mortgage-System-v1')).toBeInTheDocument();
  });

  it('disables Delete Project button until exact project name is entered', async () => {
    renderWithRouter();

    await screen.findByRole('heading', { name: /Delete Modernization Project\?/i });

    const deleteBtns = screen.getAllByRole('button', { name: /Delete Project/i });
    const confirmDeleteBtn = deleteBtns.find((btn) => btn.getAttribute('type') === 'submit') || deleteBtns[deleteBtns.length - 1];
    expect(confirmDeleteBtn).toBeDisabled();

    const input = screen.getByPlaceholderText('Mortgage-System-v1');
    fireEvent.change(input, { target: { value: 'WrongName' } });
    expect(confirmDeleteBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: 'Mortgage-System-v1' } });
    expect(confirmDeleteBtn).not.toBeDisabled();
  });

  it('executes project deletion and shows success feedback when confirmed', async () => {
    renderWithRouter();

    await screen.findByRole('heading', { name: /Delete Modernization Project\?/i });

    const input = screen.getByPlaceholderText('Mortgage-System-v1');
    fireEvent.change(input, { target: { value: 'Mortgage-System-v1' } });

    const deleteBtns = screen.getAllByRole('button', { name: /Delete Project/i });
    const confirmDeleteBtn = deleteBtns.find((btn) => btn.getAttribute('type') === 'submit') || deleteBtns[deleteBtns.length - 1];
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(screen.getByText(/was deleted successfully/i)).toBeInTheDocument();
    });
  });
});
