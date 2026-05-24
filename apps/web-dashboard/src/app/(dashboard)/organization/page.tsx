'use client';

import { useState } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';

export default function OrganizationPage() {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [name, setName] = useState(currentOrg?.name || '');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization"
        description="Manage your organization settings"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">General Information</CardTitle>
          <CardDescription>Basic details about your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={currentOrg?.slug || ''} readOnly disabled />
          </div>
          <div className="space-y-2">
            <Label>Plan</Label>
            <div>
              <Badge variant="secondary" className="capitalize">
                {currentOrg?.plan || 'free'}
              </Badge>
            </div>
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
