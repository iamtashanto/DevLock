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

/**
 * The API represents a license with `customerName`/`customerEmail`/`maxActivations`/
 * `currentActivations`; the dashboard uses `holder`/`maxDevices`/`currentDevices`.
 * Map between the two shapes here so the pages stay simple.
 */
function mapLicense(l: any): License {
  return {
    id: l?.id ?? l?._id ?? '',
    key: l?.key ?? '',
    projectId: l?.projectId ?? '',
    status: l?.status,
    type: l?.type,
    holder: { name: l?.customerName ?? '', email: l?.customerEmail ?? '', company: l?.company },
    maxDevices: l?.maxActivations ?? 0,
    currentDevices: l?.currentActivations ?? 0,
    maxDomains: l?.maxDomains ?? 0,
    features: Array.isArray(l?.features) ? l.features : [],
    metadata: l?.metadata,
    expiresAt: l?.expiresAt ?? null,
    lastValidatedAt: l?.lastValidatedAt ?? null,
    createdAt: l?.createdAt ?? '',
    updatedAt: l?.updatedAt ?? l?.createdAt ?? '',
  };
}

export const licenseService = {
  async list(projectId: string, params?: LicenseListParams): Promise<LicenseListResponse> {
    const res = await apiClient.get<any>(`/projects/${projectId}/licenses`, {
      params: params as unknown as Record<string, string | number | boolean | undefined>,
    });
    const arr = Array.isArray(res) ? res : (res?.data ?? res?.licenses ?? []);
    return {
      licenses: arr.map(mapLicense),
      total: arr.length,
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
    };
  },

  async getById(projectId: string, licenseId: string): Promise<License> {
    return mapLicense(await apiClient.get<any>(`/projects/${projectId}/licenses/${licenseId}`));
  },

  async create(projectId: string, data: CreateLicenseRequest): Promise<License> {
    const payload = {
      type: data.type,
      maxActivations: data.maxDevices ?? 1,
      customerName: data.holder.name || undefined,
      customerEmail: data.holder.email || undefined,
      expiresAt: data.expiresAt,
      features: data.features ?? [],
      metadata: data.metadata ?? {},
    };
    return mapLicense(await apiClient.post<any>(`/projects/${projectId}/licenses`, payload));
  },

  async suspend(projectId: string, licenseId: string, reason?: string): Promise<License> {
    return mapLicense(await apiClient.post<any>(`/projects/${projectId}/licenses/${licenseId}/suspend`, {
      reason: reason || 'Suspended from dashboard',
    }));
  },

  async revoke(projectId: string, licenseId: string, reason?: string): Promise<License> {
    return mapLicense(await apiClient.post<any>(`/projects/${projectId}/licenses/${licenseId}/revoke`, {
      reason: reason || 'Revoked from dashboard',
    }));
  },

  async reactivate(projectId: string, licenseId: string): Promise<License> {
    return mapLicense(await apiClient.post<any>(`/projects/${projectId}/licenses/${licenseId}/reactivate`));
  },
};
