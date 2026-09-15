import { apiClient } from '@/services/api/apiClient';
import { mockQuota } from '@/mocks/projects.mock';
import type { CreateProjectPayload, Project, WorkspaceQuota } from '../types/project';

/** Real, backend-backed project CRUD. No mock fallback on failure — a failed request
 * must surface as a real error the UI can show, never silently swap in fake data
 * (that previously meant a brand-new org with zero real projects would see 3 invented
 * demo projects, including one — "proj-acme" — that led every page built on top of it
 * into dead ends). */
export class ProjectService {
  async getProjects(): Promise<Project[]> {
    return apiClient.get<Project[]>('/projects');
  }

  async getProjectById(id: string): Promise<Project | null> {
    try {
      return await apiClient.get<Project>(`/projects/${id}`);
    } catch {
      return null;
    }
  }

  async createProject(payload: CreateProjectPayload): Promise<Project> {
    return apiClient.post<Project>('/projects', {
      name: payload.name,
      description: payload.description,
      conversionType: payload.conversionType,
    });
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
