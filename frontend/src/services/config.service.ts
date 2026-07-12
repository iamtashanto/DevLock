import { apiClient } from '@/lib/api-client';

export interface RemoteConfig {
  id: string;
  projectId: string;
  maintenance: boolean;
  maintenanceMessage?: string;
  killSwitch: boolean;
  killSwitchReason?: string;
  domainLock?: { enabled: boolean; action: string; domains: string[] };
  notifications: ConfigNotification[];
  customConfig: Record<string, unknown>;
  updatedAt: string;
}

/**
 * The API stores maintenance/killSwitch as nested `{ enabled, ... }` objects.
 * Flatten them to booleans so the dashboard reads them correctly — an object is
 * always truthy, which previously made the UI show "ACTIVATED" even when off.
 */
function normalizeConfig(raw: any): RemoteConfig {
  return {
    id: raw?._id ?? raw?.id ?? '',
    projectId: raw?.projectId ?? '',
    maintenance: raw?.maintenance?.enabled === true,
    maintenanceMessage: raw?.maintenance?.message,
    killSwitch: raw?.killSwitch?.enabled === true,
    killSwitchReason: raw?.killSwitch?.reason,
    domainLock: raw?.domainLock,
    notifications: Array.isArray(raw?.notifications) ? raw.notifications : [],
    customConfig: raw?.customConfig ?? raw?.customData ?? {},
    updatedAt: raw?.updatedAt ?? '',
  };
}

export interface ConfigNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'error' | 'payment';
  active: boolean;
  createdAt: string;
}

export interface UpdateConfigRequest {
  maintenance?: boolean;
  killSwitch?: boolean;
  killSwitchReason?: string;
  domainLock?: { enabled: boolean; action: string; domains: string[] };
  customConfig?: Record<string, unknown>;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeatureFlagRequest {
  key: string;
  name: string;
  description?: string;
  enabled?: boolean;
}

export const configService = {
  async getConfig(projectId: string): Promise<RemoteConfig> {
    return normalizeConfig(await apiClient.get(`/projects/${projectId}/config`));
  },

  async updateConfig(projectId: string, data: UpdateConfigRequest): Promise<RemoteConfig> {
    return normalizeConfig(await apiClient.put(`/projects/${projectId}/config`, data));
  },

  async toggleMaintenance(projectId: string, enabled: boolean): Promise<RemoteConfig> {
    return normalizeConfig(await apiClient.post(`/projects/${projectId}/config/maintenance`, { enabled }));
  },

  async activateKillSwitch(projectId: string, reason: string): Promise<RemoteConfig> {
    return normalizeConfig(await apiClient.post(`/projects/${projectId}/config/kill-switch/activate`, { reason }));
  },

  async deactivateKillSwitch(projectId: string): Promise<RemoteConfig> {
    return normalizeConfig(await apiClient.post(`/projects/${projectId}/config/kill-switch/deactivate`));
  },

  // Feature Flags
  listFlags(projectId: string): Promise<FeatureFlag[]> {
    return apiClient.get<FeatureFlag[]>(`/projects/${projectId}/flags`);
  },

  createFlag(projectId: string, data: CreateFeatureFlagRequest): Promise<FeatureFlag> {
    return apiClient.post<FeatureFlag>(`/projects/${projectId}/flags`, data);
  },

  toggleFlag(projectId: string, flagId: string, enabled: boolean): Promise<FeatureFlag> {
    return apiClient.patch<FeatureFlag>(`/projects/${projectId}/flags/${flagId}`, { enabled });
  },

  deleteFlag(projectId: string, flagId: string): Promise<void> {
    return apiClient.delete<void>(`/projects/${projectId}/flags/${flagId}`);
  },
};
