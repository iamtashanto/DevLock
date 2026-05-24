'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/project.service';
import { analyticsService } from '@/services/analytics.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardsSkeleton } from '@/components/shared/loading-skeleton';
import { Key, CheckCircle, AlertTriangle, Activity } from 'lucide-react';

export default function ProjectOverviewPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getById(projectId),
    enabled: !!projectId,
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', 'project', projectId],
    queryFn: () => analyticsService.getProjectAnalytics(projectId),
    enabled: !!projectId,
  });

  const statCards = [
    {
      title: 'Total Licenses',
      value: analytics?.totalLicenses ?? project?.totalLicenses ?? 0,
      icon: Key,
    },
    {
      title: 'Active Licenses',
      value: analytics?.activeLicenses ?? project?.activeLicenses ?? 0,
      icon: CheckCircle,
    },
    {
      title: 'Validations Today',
      value: analytics?.validationsToday ?? 0,
      icon: Activity,
    },
    {
      title: 'This Month',
      value: analytics?.validationsThisMonth ?? 0,
      icon: AlertTriangle,
    },
  ];

  if (isLoading) {
    return <CardsSkeleton />;
  }

  return (
    <div className="space-y-6">
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Licenses</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics?.topLicenses?.length ? (
            <div className="space-y-3">
              {analytics.topLicenses.map((license) => (
                <div key={license.licenseId} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{license.holder}</span>
                  <span className="text-muted-foreground">{license.validations} validations</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No license activity yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
