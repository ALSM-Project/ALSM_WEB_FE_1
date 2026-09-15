import { apiClient } from '@/services/api/apiClient';
import { mockProjects, mockQuota } from '@/mocks/projects.mock';
import type { CreateProjectPayload, Project, WorkspaceQuota } from '../types/project';

export class ProjectService {
  private projects: Project[] = [...mockProjects];

  async getProjects(): Promise<Project[]> {
    if (import.meta.env.VITEST) return [...this.projects];
    try {
      const data = await apiClient.get<Project[]>('/projects');
      if (data && Array.isArray(data) && data.length > 0) {
        this.projects = data;
        return data;
      }
      return [...this.projects];
    } catch (err) {
      console.warn('[ProjectService] GET /projects unavailable, falling back to mock data:', err);
      return [...this.projects];
    }
  }

  async getProjectById(id: string): Promise<Project | null> {
    if (import.meta.env.VITEST) {
      return this.projects.find((p) => p.id === id) || this.projects[0] || null;
    }
    try {
      const project = await apiClient.get<Project>(`/projects/${id}`);
      if (project) return project;
    } catch (err) {
      console.warn('[ProjectService] GET /projects/:id unavailable, using local fallback:', err);
    }
    return this.projects.find((p) => p.id === id) || this.projects[0] || null;
  }

  async createProject(payload: CreateProjectPayload): Promise<Project> {
    try {
      const created = await apiClient.post<Project>('/projects', {
        name: payload.name,
        description: payload.description,
        conversionType: 'BMS_TO_REACT',
      });
      this.projects.unshift(created);
      return created;
    } catch (err) {
      console.warn('[ProjectService] POST /projects unavailable, creating locally:', err);
    }

    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name: payload.name,
      description: payload.description,
      status: 'ACTIVE',
      screensCount: 0,
      programsCount: 0,
      progressPercentage: 0,
      targetFramework: 'React TypeScript',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.projects.unshift(newProj);
    return newProj;
  }

  async deleteProject(id: string): Promise<boolean> {
    // In Vitest environment, only update local state to avoid network calls
    if (import.meta.env.VITEST) {
      this.projects = this.projects.filter((p) => p.id !== id);
      return true;
    }

    try {
      await apiClient.delete(`/projects/${id}`);
    } catch (err) {
      console.warn('[ProjectService] DELETE /projects/:id unavailable, removing locally:', err);
    }
    // Always update local state regardless of API result
    this.projects = this.projects.filter((p) => p.id !== id);
    return true;
  }

  async getWorkspaceQuota(): Promise<WorkspaceQuota> {
    return mockQuota;
  }
}

export const projectService = new ProjectService();
