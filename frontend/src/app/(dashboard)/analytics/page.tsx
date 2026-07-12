import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Global Analytics" 
        description="View insights across all your projects" 
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            Global analytics across all projects is currently under development. Please check individual project analytics in the meantime.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground border-t border-border bg-muted/20">
          Analytics Dashboard Coming Soon
        </CardContent>
      </Card>
    </div>
  );
}
