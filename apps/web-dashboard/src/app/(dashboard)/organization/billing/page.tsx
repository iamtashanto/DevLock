'use client';

import { useState } from 'react';
import { useOrgStore } from '@/stores/org-store';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Zap, DollarSign, Bitcoin, Receipt } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

const PLANS = [
  { id: 'free', name: 'Free', price: '$0', features: ['1 Project', '100 Licenses', 'Community Support'] },
  { id: 'starter', name: 'Starter', price: '$29', priceBDT: 3000, features: ['5 Projects', '1,000 Licenses', 'Email Support'] },
  { id: 'pro', name: 'Pro', price: '$99', priceBDT: 10000, features: ['Unlimited Projects', '10,000 Licenses', 'Priority Support'] },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', priceBDT: 25000, features: ['Unlimited Licenses', 'Dedicated Support'] },
];

export default function BillingPage() {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const currentPlan = currentOrg?.plan || 'free';

  const [method, setMethod] = useState<'bkash' | 'nagad' | 'crypto'>('bkash');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('pro');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const plan = PLANS.find(p => p.id === selectedPlanId);
      await apiClient.post('/billing/manual-payment', {
        method,
        transactionId,
        amount: plan?.priceBDT || 0,
        currency: 'BDT',
        planId: selectedPlanId,
      });
      setSuccess(true);
      setTransactionId('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader title="Billing & Subscription" description="Manage your subscription and billing" />

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

      {/* Manual Payment Section */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Upgrade via Manual Payment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. Select Plan</CardTitle>
              <CardDescription>Choose the plan you want to upgrade to</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {PLANS.filter(p => p.id !== 'free').map((p) => (
                <label key={p.id} className={`flex items-center justify-between p-4 rounded-lg cursor-pointer border ${selectedPlanId === p.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-accent'}`}>
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-muted-foreground">৳{p.priceBDT}/mo</div>
                  </div>
                  <input type="radio" checked={selectedPlanId === p.id} onChange={() => setSelectedPlanId(p.id)} className="w-4 h-4 text-primary" />
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. Payment Details</CardTitle>
              <CardDescription>Send payment and submit your Transaction ID</CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="bg-green-500/10 text-green-500 p-4 rounded-lg border border-green-500/20">
                  Payment submitted successfully! Our admins will review and activate your plan shortly.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card cursor-pointer">
                      <input type="radio" checked={method === 'bkash'} onChange={() => setMethod('bkash')} className="text-primary" />
                      <DollarSign className="w-5 h-5 text-pink-500" />
                      <span>bKash (Send to 017XXXXXX)</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card cursor-pointer">
                      <input type="radio" checked={method === 'nagad'} onChange={() => setMethod('nagad')} className="text-primary" />
                      <DollarSign className="w-5 h-5 text-orange-500" />
                      <span>Nagad (Send to 017XXXXXX)</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card cursor-pointer">
                      <input type="radio" checked={method === 'crypto'} onChange={() => setMethod('crypto')} className="text-primary" />
                      <Bitcoin className="w-5 h-5 text-yellow-500" />
                      <span>Crypto (USDT TRC20: TXXXX...)</span>
                    </label>
                  </div>

                  <div className="pt-2 space-y-2">
                    <label className="text-sm font-medium">Transaction ID / Hash</label>
                    <input
                      type="text"
                      required
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Enter TrxID here..."
                    />
                  </div>

                  {error && <div className="text-red-500 text-sm">{error}</div>}

                  <Button type="submit" disabled={loading} className="w-full">
                    <Receipt className="w-4 h-4 mr-2" />
                    {loading ? 'Submitting...' : 'Submit Payment'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="my-8" />

      <div className="text-center">
        <p className="text-muted-foreground">For any help contact <a href="mailto:hello@tashanto.com" className="text-primary font-medium hover:underline">hello@tashanto.com</a></p>
      </div>
    </div>
  );
}
