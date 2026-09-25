import { apiClient } from '@/services/api/apiClient';
import { mockQuota } from '@/mocks/projects.mock';
import type { CreateProjectPayload, Project, WorkspaceQuota } from '../types/project';
import { cacheProjectName } from '@/shared/utils/projectCache';

/** Real, backend-backed project CRUD. No mock fallback on failure — a failed request
 * must surface as a real error the UI can show, never silently swap in fake data
 * (that previously meant a brand-new org with zero real projects would see 3 invented
 * demo projects, including one — "proj-acme" — that led every page built on top of it
 * into dead ends). */
export class ProjectService {
  async getProjects(): Promise<Project[]> {
    const projects = await apiClient.get<Project[]>('/projects');
    if (Array.isArray(projects)) {
      projects.forEach((p) => cacheProjectName(p.id, p.name));
    }
    return projects;
  }

  async getProjectById(id: string): Promise<Project | null> {
    try {
      const proj = await apiClient.get<Project>(`/projects/${id}`);
      if (proj && proj.name) {
        cacheProjectName(proj.id, proj.name);
      }
      return proj;
    } catch {
      return null;
    }
  }

  async getProject(id: string): Promise<Project | null> {
    return this.getProjectById(id);
  }

  async createProject(payload: CreateProjectPayload): Promise<Project> {
    const created = await apiClient.post<Project>('/projects', {
      name: payload.name,
      description: payload.description,
      conversionType: payload.conversionType,
    });
    if (created && created.id && created.name) {
      cacheProjectName(created.id, created.name);
    }
    return created;
  }

  async deleteProject(id: string): Promise<boolean> {
    await apiClient.delete(`/projects/${id}`);
    return true;
  }

  async getWorkspaceQuota(): Promise<WorkspaceQuota> {
    return mockQuota;
  }
}

export const projectService = new ProjectService();
