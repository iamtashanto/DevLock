'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardsSkeleton } from '@/components/shared/loading-skeleton';
import { FolderKanban, Key, CheckCircle, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => analyticsService.getOverview(),
  });

  const statCards = [
    {
      title: 'Total Projects',
      value: stats?.totalProjects ?? 0,
      icon: FolderKanban,
      description: stats?.maxProjects ? `${stats.totalProjects} / ${stats.maxProjects} projects used` : 'Active projects in your organization',
    },
    {
      title: 'Total Licenses',
      value: stats?.totalLicenses ?? 0,
      icon: Key,
      description: 'All licenses across projects',
    },
    {
      title: 'Active Licenses',
      value: stats?.activeLicenses ?? 0,
      icon: CheckCircle,
      description: 'Currently active and valid',
    },
    {
      title: 'Expired / Suspended',
      value: (stats?.expiredLicenses ?? 0) + (stats?.suspendedLicenses ?? 0),
      icon: AlertTriangle,
      description: 'Require attention',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your licensing platform"
      />

      {isLoading ? (
        <CardsSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats?.validationsToday
                ? `${stats.validationsToday} license validations today`
                : 'No recent activity'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Devices</span>
                <span className="font-medium">{stats?.activeDevices ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Validations Today</span>
                <span className="font-medium">{stats?.validationsToday ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Validations</span>
                <span className="font-medium">{stats?.totalValidations?.toLocaleString() ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
