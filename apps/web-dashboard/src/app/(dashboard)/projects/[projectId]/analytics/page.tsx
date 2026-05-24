'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardsSkeleton } from '@/components/shared/loading-skeleton';
import { Activity, Globe, Monitor, TrendingUp } from 'lucide-react';

export default function ProjectAnalyticsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const { data: usage, isLoading } = useQuery({
    queryKey: ['analytics', 'usage', projectId],
    queryFn: () => analyticsService.getUsage({ projectId }),
    enabled: !!projectId,
  });

  const { data: projectAnalytics } = useQuery({
    queryKey: ['analytics', 'project', projectId],
    queryFn: () => analyticsService.getProjectAnalytics(projectId),
    enabled: !!projectId,
  });

  if (isLoading) {
    return <CardsSkeleton count={4} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          License validation metrics and usage data
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage?.averageDaily ?? 0}</div>
            <p className="text-xs text-muted-foreground">validations per day</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage?.peakHour !== undefined ? `${usage.peakHour}:00` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">highest traffic</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projectAnalytics?.validationsThisWeek?.toLocaleString() ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">validations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projectAnalytics?.validationsThisMonth?.toLocaleString() ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">validations</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Countries */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Top Countries</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {usage?.topCountries?.length ? (
              <div className="space-y-3">
                {usage.topCountries.map((item) => (
                  <div key={item.country} className="flex items-center justify-between text-sm">
                    <span>{item.country}</span>
                    <span className="font-medium">{item.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Top Devices</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {usage?.topDevices?.length ? (
              <div className="space-y-3">
                {usage.topDevices.map((item) => (
                  <div key={item.device} className="flex items-center justify-between text-sm">
                    <span>{item.device}</span>
                    <span className="font-medium">{item.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Validation chart placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Validations Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              Chart visualization — integrate with your preferred charting library
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
