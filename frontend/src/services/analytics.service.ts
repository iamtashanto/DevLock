import { apiClient } from '@/lib/api-client';

export interface AnalyticsOverview {
  totalProjects: number;
  maxProjects?: number;
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  suspendedLicenses: number;
  totalValidations: number;
  validationsToday: number;
  activeDevices: number;
}

export interface LicenseStats {
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  createdOverTime: { date: string; count: number }[];
  expiringThisMonth: number;
}

export interface UsageData {
  validations: { date: string; count: number }[];
  peakHour: number;
  averageDaily: number;
  topCountries: { country: string; count: number }[];
  topDevices: { device: string; count: number }[];
}

export interface ProjectAnalytics {
  projectId: string;
  totalLicenses: number;
  activeLicenses: number;
  validationsToday: number;
  validationsThisWeek: number;
  validationsThisMonth: number;
  validationsByDay: { date: string; count: number }[];
  topLicenses: { licenseId: string; holder: string; validations: number }[];
}

export const analyticsService = {
  getOverview(): Promise<AnalyticsOverview> {
    return apiClient.get<AnalyticsOverview>('/analytics/overview');
  },

  getLicenseStats(params?: { projectId?: string }): Promise<LicenseStats> {
    return apiClient.get<LicenseStats>('/analytics/licenses', { params });
  },

  getUsage(params?: { projectId?: string; period?: '7d' | '30d' | '90d' }): Promise<UsageData> {
    return apiClient.get<UsageData>('/analytics/usage', { params });
  },

  getProjectAnalytics(projectId: string): Promise<ProjectAnalytics> {
    return apiClient.get<ProjectAnalytics>(`/analytics/projects/${projectId}`);
  },
};
