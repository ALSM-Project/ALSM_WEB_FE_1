import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Project } from '../types/project';
import { ModernizationDashboardPage } from './ModernizationDashboardPage';

const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Mortgage Modernization',
    description: 'Modernizing legacy BMS maps',
    status: 'ACTIVE',
    conversionType: 'BMS_DSPF_TO_FRONTEND',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-10T10:00:00Z',
  },
  {
    id: 'proj-2',
    name: 'Payroll Modernization',
    description: 'COBOL to Java migration',
    status: 'DRAFT',
    conversionType: 'COBOL_TO_JAVA',
    createdAt: '2026-08-02T10:00:00Z',
    updatedAt: '2026-08-09T10:00:00Z',
  },
];

const mocks = vi.hoisted(() => ({
  getProjects: vi.fn(),
}));

vi.mock('../services/project.service', () => ({
  projectService: {
    getProjects: mocks.getProjects,
  },
}));

describe('ModernizationDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () => {
    return render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<ModernizationDashboardPage />} />
          <Route path="/projects" element={<div>Projects List Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders hero, project metric counts, and recent projects', async () => {
    mocks.getProjects.mockResolvedValue(mockProjects);
    renderPage();

    expect(await screen.findByRole('heading', { name: /Automating Legacy System Modernization/i })).toBeInTheDocument();
    expect(await screen.findByText('Mortgage Modernization')).toBeInTheDocument();
    expect(screen.getByText('Payroll Modernization')).toBeInTheDocument();

    const totalProjectsCard = screen.getByTitle('Click to view all projects');
    expect(totalProjectsCard).toHaveTextContent('2');

    const activeProjectsCard = screen.getByTitle('Click to view active projects');
    expect(activeProjectsCard).toHaveTextContent('1');
  });

  it('renders useful empty state when user has no projects', async () => {
    mocks.getProjects.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByRole('heading', { name: /No Projects Found/i })).toBeInTheDocument();
    expect(screen.getByText(/You haven't created any modernization projects yet/i)).toBeInTheDocument();
  });

  it('renders modernization workflow with real stages', async () => {
    mocks.getProjects.mockResolvedValue(mockProjects);
    renderPage();

    expect(await screen.findByText('Modernization Workflow')).toBeInTheDocument();
    expect(screen.getAllByText('Upload').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Convert').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Validate').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Export').length).toBeGreaterThanOrEqual(1);
  });
});
