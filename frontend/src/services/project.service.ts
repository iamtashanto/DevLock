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

/**
 * The API returns a project as `{ publicKey, secretKey, isActive, ... }`; the
 * dashboard uses `{ apiKey, status, ... }`. Map between the two shapes here.
 */
function mapProject(p: any): Project {
  return {
    id: p?.id ?? p?._id ?? '',
    name: p?.name ?? '',
    slug: p?.slug ?? '',
    description: p?.description,
    orgId: p?.tenantId ?? p?.orgId ?? '',
    status: p?.isActive === false ? 'archived' : 'active',
    apiKey: p?.publicKey ?? p?.apiKey ?? '',
    secretKey: p?.secretKey ?? '',
    totalLicenses: p?.totalLicenses ?? 0,
    activeLicenses: p?.activeLicenses ?? 0,
    createdAt: p?.createdAt ?? '',
    updatedAt: p?.updatedAt ?? p?.createdAt ?? '',
  };
}

export const projectService = {
  async list(params?: { page?: number; limit?: number; search?: string }): Promise<ProjectListResponse> {
    const res = await apiClient.get<any>('/projects', { params });
    const arr = Array.isArray(res) ? res : (res?.projects ?? res?.data ?? []);
    return { projects: arr.map(mapProject), total: arr.length, page: params?.page ?? 1, limit: params?.limit ?? 50 };
  },

  async getById(projectId: string): Promise<Project> {
    return mapProject(await apiClient.get<any>(`/projects/${projectId}`));
  },

  async create(data: CreateProjectRequest): Promise<Project> {
    return mapProject(await apiClient.post<any>('/projects', data));
  },

  async update(projectId: string, data: UpdateProjectRequest): Promise<Project> {
    return mapProject(await apiClient.put<any>(`/projects/${projectId}`, data));
  },

  delete(projectId: string): Promise<void> {
    return apiClient.delete<void>(`/projects/${projectId}`);
  },

  rotateKeys(projectId: string): Promise<ProjectKeys> {
    return apiClient.post<ProjectKeys>(`/projects/${projectId}/rotate-keys`);
  },

  // Allowed domains (returns the full updated list)
  listDomains(projectId: string): Promise<string[]> {
    return apiClient.get<string[]>(`/projects/${projectId}/domains`);
  },

  addDomain(projectId: string, domain: string): Promise<string[]> {
    return apiClient.post<string[]>(`/projects/${projectId}/domains`, { domain });
  },

  removeDomain(projectId: string, domain: string): Promise<string[]> {
    return apiClient.delete<string[]>(`/projects/${projectId}/domains/${encodeURIComponent(domain)}`);
  },
};
