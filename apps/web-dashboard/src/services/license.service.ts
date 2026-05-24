import { apiClient } from '@/lib/api-client';

export type LicenseStatus = 'active' | 'expired' | 'suspended' | 'revoked' | 'trial';
export type LicenseType = 'perpetual' | 'subscription' | 'trial' | 'node-locked' | 'floating';

export interface License {
  id: string;
  key: string;
  projectId: string;
  status: LicenseStatus;
  type: LicenseType;
  holder: {
    name: string;
    email: string;
    company?: string;
  };
  maxDevices: number;
  currentDevices: number;
  maxDomains: number;
  features: string[];
  metadata?: Record<string, unknown>;
  expiresAt: string | null;
  lastValidatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLicenseRequest {
  type: LicenseType;
  holder: {
    name: string;
    email: string;
    company?: string;
  };
  maxDevices?: number;
  maxDomains?: number;
  features?: string[];
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface LicenseListResponse {
  licenses: License[];
  total: number;
  page: number;
  limit: number;
}

export interface LicenseListParams {
  page?: number;
  limit?: number;
  status?: LicenseStatus;
  type?: LicenseType;
  search?: string;
}

export const licenseService = {
  list(projectId: string, params?: LicenseListParams): Promise<LicenseListResponse> {
    return apiClient.get<LicenseListResponse>(`/projects/${projectId}/licenses`, {
      params: params as unknown as Record<string, string | number | boolean | undefined>,
    });
  },

  getById(projectId: string, licenseId: string): Promise<License> {
    return apiClient.get<License>(`/projects/${projectId}/licenses/${licenseId}`);
  },

  create(projectId: string, data: CreateLicenseRequest): Promise<License> {
    return apiClient.post<License>(`/projects/${projectId}/licenses`, data);
  },

  suspend(projectId: string, licenseId: string, reason?: string): Promise<License> {
    return apiClient.post<License>(`/projects/${projectId}/licenses/${licenseId}/suspend`, { reason });
  },

  revoke(projectId: string, licenseId: string, reason?: string): Promise<License> {
    return apiClient.post<License>(`/projects/${projectId}/licenses/${licenseId}/revoke`, { reason });
  },

  reactivate(projectId: string, licenseId: string): Promise<License> {
    return apiClient.post<License>(`/projects/${projectId}/licenses/${licenseId}/reactivate`);
  },
};
