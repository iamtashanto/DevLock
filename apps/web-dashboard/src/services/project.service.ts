import { apiClient } from '@/lib/api-client';

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  orgId: string;
  status: 'active' | 'archived';
  apiKey: string;
  secretKey: string;
  totalLicenses: number;
  activeLicenses: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'archived';
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
}

export interface ProjectKeys {
  apiKey: string;
  secretKey: string;
}

export const projectService = {
  list(params?: { page?: number; limit?: number; search?: string }): Promise<ProjectListResponse> {
    return apiClient.get<ProjectListResponse>('/projects', { params });
  },

  getById(projectId: string): Promise<Project> {
    return apiClient.get<Project>(`/projects/${projectId}`);
  },

  create(data: CreateProjectRequest): Promise<Project> {
    return apiClient.post<Project>('/projects', data);
  },

  update(projectId: string, data: UpdateProjectRequest): Promise<Project> {
    return apiClient.put<Project>(`/projects/${projectId}`, data);
  },

  delete(projectId: string): Promise<void> {
    return apiClient.delete<void>(`/projects/${projectId}`);
  },

  rotateKeys(projectId: string): Promise<ProjectKeys> {
    return apiClient.post<ProjectKeys>(`/projects/${projectId}/rotate-keys`);
  },
};
