'use client';

import { useOrgStore } from '@/stores/org-store';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Zap } from 'lucide-react';

const PLANS = [
  { name: 'Free', price: '$0', features: ['1 Project', '100 Licenses', 'Community Support'] },
  { name: 'Starter', price: '$29', features: ['5 Projects', '1,000 Licenses', 'Email Support', 'Custom Domains'] },
  { name: 'Pro', price: '$99', features: ['Unlimited Projects', '10,000 Licenses', 'Priority Support', 'Custom Domains', 'Feature Flags', 'Analytics'] },
  { name: 'Enterprise', price: 'Custom', features: ['Everything in Pro', 'Unlimited Licenses', 'Dedicated Support', 'SLA', 'SSO', 'Audit Logs'] },
];

export default function BillingPage() {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const currentPlan = currentOrg?.plan || 'free';

  return (
    <div className="space-y-6">
      <PageHeader title="Billing" description="Manage your subscription and billing" />

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Plan</CardTitle>
          <CardDescription>Your organization is on the {currentPlan} plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold capitalize">{currentPlan} Plan</p>
                <p className="text-sm text-muted-foreground">
                  {currentPlan === 'free' ? 'Limited features' : 'Full access to all features'}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="capitalize">
              {currentPlan}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage</CardTitle>
          <CardDescription>Current billing period usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Projects</span>
            <span className="text-sm font-medium">2 / 5</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-2 w-2/5 rounded-full bg-primary" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm">Licenses</span>
            <span className="text-sm font-medium">156 / 1,000</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-2 w-[15%] rounded-full bg-primary" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm">API Calls (this month)</span>
            <span className="text-sm font-medium">12,450 / 50,000</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-2 w-1/4 rounded-full bg-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Available Plans</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={plan.name.toLowerCase() === currentPlan ? 'border-primary' : ''}
            >
              <CardHeader>
                <CardTitle className="text-base">{plan.name}</CardTitle>
                <p className="text-2xl font-bold">
                  {plan.price}
                  {plan.price !== 'Custom' && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-4 w-full"
                  variant={plan.name.toLowerCase() === currentPlan ? 'outline' : 'default'}
                  disabled={plan.name.toLowerCase() === currentPlan}
                >
                  {plan.name.toLowerCase() === currentPlan ? 'Current Plan' : 'Upgrade'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
