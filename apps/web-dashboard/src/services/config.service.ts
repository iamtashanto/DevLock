import { apiClient } from '@/lib/api-client';

export interface RemoteConfig {
  id: string;
  projectId: string;
  maintenance: boolean;
  killSwitch: boolean;
  killSwitchReason?: string;
  notifications: ConfigNotification[];
  customConfig: Record<string, unknown>;
  updatedAt: string;
}

export interface ConfigNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical';
  active: boolean;
  createdAt: string;
}

export interface UpdateConfigRequest {
  maintenance?: boolean;
  killSwitch?: boolean;
  killSwitchReason?: string;
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
  getConfig(projectId: string): Promise<RemoteConfig> {
    return apiClient.get<RemoteConfig>(`/projects/${projectId}/config`);
  },

  updateConfig(projectId: string, data: UpdateConfigRequest): Promise<RemoteConfig> {
    return apiClient.put<RemoteConfig>(`/projects/${projectId}/config`, data);
  },

  toggleMaintenance(projectId: string, enabled: boolean): Promise<RemoteConfig> {
    return apiClient.post<RemoteConfig>(`/projects/${projectId}/config/maintenance`, { enabled });
  },

  activateKillSwitch(projectId: string, reason: string): Promise<RemoteConfig> {
    return apiClient.post<RemoteConfig>(`/projects/${projectId}/config/kill-switch/activate`, { reason });
  },

  deactivateKillSwitch(projectId: string): Promise<RemoteConfig> {
    return apiClient.post<RemoteConfig>(`/projects/${projectId}/config/kill-switch/deactivate`);
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
