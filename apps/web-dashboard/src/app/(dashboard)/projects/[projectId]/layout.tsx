'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/project.service';
import { PROJECT_TABS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const projectId = params.projectId as string;

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getById(projectId),
    enabled: !!projectId,
  });

  const basePath = `/projects/${projectId}`;

  const isTabActive = (tabHref: string) => {
    const fullPath = `${basePath}${tabHref}`;
    if (tabHref === '') return pathname === basePath;
    return pathname.startsWith(fullPath);
  };

  return (
    <div className="space-y-6">
      {/* Project header */}
      <div>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project?.name}</h1>
            {project?.description && (
              <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Project tabs">
          {PROJECT_TABS.map((tab) => (
            <Link
              key={tab.title}
              href={`${basePath}${tab.href}`}
              className={cn(
                'whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                isTabActive(tab.href)
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              )}
            >
              {tab.title}
            </Link>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {children}
    </div>
  );
}
