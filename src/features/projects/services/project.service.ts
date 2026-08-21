import { mockProjects, mockQuota } from '@/mocks/projects.mock';
import type { CreateProjectPayload, Project, WorkspaceQuota } from '../types/project';

export class ProjectService {
  private projects: Project[] = [...mockProjects];

  async getProjects(): Promise<Project[]> {
    return [...this.projects];
  }

  async getProjectById(id: string): Promise<Project | null> {
    return this.projects.find((p) => p.id === id) || this.projects[0] || null;
  }

  async createProject(payload: CreateProjectPayload): Promise<Project> {
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
    this.projects = this.projects.filter((p) => p.id !== id);
    return true;
  }

  async getWorkspaceQuota(): Promise<WorkspaceQuota> {
    return mockQuota;
  }
}

export const projectService = new ProjectService();
