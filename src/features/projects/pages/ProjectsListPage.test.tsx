import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProjectsListPage } from './ProjectsListPage';

describe('ProjectsListPage', () => {
  const renderWithRouter = () => {
    return render(
      <MemoryRouter initialEntries={['/projects']}>
        <Routes>
          <Route path="/projects" element={<ProjectsListPage />} />
          <Route path="/projects/:projectId/screens" element={<div>Workspace Page</div>} />
          <Route path="/projects/:projectId/delete" element={<div>Delete Modal Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders page header title, search bar, and project cards', () => {
    renderWithRouter();

    expect(screen.getByRole('heading', { name: /Modernization Projects/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search projects by name/i)).toBeInTheDocument();
    expect(screen.getByText('Acme Core Banking Modernization')).toBeInTheDocument();
    expect(screen.getByText('Insurance Policy Ledger Engine')).toBeInTheDocument();
  });

  it('filters project cards when typing search query', () => {
    renderWithRouter();

    const searchInput = screen.getByPlaceholderText(/Search projects by name/i);
    fireEvent.change(searchInput, { target: { value: 'Insurance' } });

    expect(screen.getByText('Insurance Policy Ledger Engine')).toBeInTheDocument();
    expect(screen.queryByText('Acme Core Banking Modernization')).not.toBeInTheDocument();
  });

  it('filters project cards when clicking type filter buttons', () => {
    renderWithRouter();

    const cobolBtn = screen.getByRole('button', { name: 'COBOL' });
    fireEvent.click(cobolBtn);

    expect(screen.getByText('Insurance Policy Ledger Engine')).toBeInTheDocument();
    expect(screen.queryByText('Acme Core Banking Modernization')).not.toBeInTheDocument();
  });

  it('opens create project modal when clicking Create Project button', () => {
    renderWithRouter();

    const createBtn = screen.getAllByRole('button', { name: /Create Project/i })[0];
    fireEvent.click(createBtn);

    expect(screen.getByRole('heading', { name: /Create New Project/i })).toBeInTheDocument();
  });

  it('navigates to workspace when Open Workspace button is clicked', () => {
    renderWithRouter();

    const openBtns = screen.getAllByRole('button', { name: /Open Workspace/i });
    fireEvent.click(openBtns[0]);

    expect(screen.getByText('Workspace Page')).toBeInTheDocument();
  });

  it('navigates to delete modal when delete button (trash icon) is clicked', () => {
    renderWithRouter();

    const deleteBtns = screen.getAllByTitle('Delete Project');
    fireEvent.click(deleteBtns[0]);

    expect(screen.getByText('Delete Modal Page')).toBeInTheDocument();
  });
});
