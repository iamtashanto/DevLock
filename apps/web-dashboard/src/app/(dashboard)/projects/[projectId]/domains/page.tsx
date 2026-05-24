'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Plus, Globe, ExternalLink } from 'lucide-react';

// Placeholder data - would be fetched from API
const MOCK_DOMAINS = [
  { id: '1', domain: 'app.example.com', status: 'verified', addedAt: '2024-01-15' },
  { id: '2', domain: 'staging.example.com', status: 'pending', addedAt: '2024-02-01' },
];

export default function DomainsPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Allowed Domains</h2>
          <p className="text-sm text-muted-foreground">
            Domains authorized to validate licenses for this project
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Domain
        </Button>
      </div>

      {MOCK_DOMAINS.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No domains configured"
          description="Add domains that are authorized to validate licenses"
          actionLabel="Add Domain"
          onAction={() => {}}
        />
      ) : (
        <div className="space-y-3">
          {MOCK_DOMAINS.map((domain) => (
            <Card key={domain.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{domain.domain}</p>
                    <p className="text-xs text-muted-foreground">Added {domain.addedAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={domain.status} />
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
