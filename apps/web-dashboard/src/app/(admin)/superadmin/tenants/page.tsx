'use client';

import { useState, useEffect } from 'react';
import { Users, Edit3 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Tenant {
  _id: string;
  name: string;
  slug: string;
  plan: string;
  owner: { _id: string; name: string; email: string };
  createdAt: string;
}

const PLAN_OPTIONS = ['free', 'starter', 'pro', 'enterprise'];

export default function SuperAdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<{ data: Tenant[] }>('/admin/tenants');
      setTenants(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleEditClick = (tenant: Tenant) => {
    setEditingId(tenant._id);
    setSelectedPlan(tenant.plan || 'free');
  };

  const handleUpdatePlan = async (id: string) => {
    try {
      setUpdating(true);
      await apiClient.post(`/admin/tenants/${id}/plan`, { plan: selectedPlan });
      setTenants((prev) =>
        prev.map((t) => (t._id === id ? { ...t, plan: selectedPlan } : t))
      );
      setEditingId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update plan');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-indigo-500" />
        <div>
          <h1 className="text-2xl font-semibold text-white">Tenants & Subscriptions</h1>
          <p className="mt-1 text-gray-400">Manage all organizations and manually override their subscription plans.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border p-6">
          <h2 className="text-xl font-medium text-white">All Organizations</h2>
        </div>

        {error ? (
          <div className="p-6 text-red-400">{error}</div>
        ) : loading ? (
          <div className="p-6 text-muted-foreground">Loading...</div>
        ) : tenants.length === 0 ? (
          <div className="p-6 text-muted-foreground">No tenants found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Organization</th>
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4">Current Plan</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tenants.map((tenant) => (
                  <tr key={tenant._id} className="transition-colors hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{tenant.name}</div>
                      <div className="text-xs text-muted-foreground">/{tenant.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">{tenant.owner?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{tenant.owner?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === tenant._id ? (
                        <select
                          className="rounded-md border border-border bg-background px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                          value={selectedPlan}
                          onChange={(e) => setSelectedPlan(e.target.value)}
                        >
                          {PLAN_OPTIONS.map((plan) => (
                            <option key={plan} value={plan}>
                              {plan.charAt(0).toUpperCase() + plan.slice(1)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="capitalize text-white">{tenant.plan || 'free'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="flex justify-end gap-2 px-6 py-4">
                      {editingId === tenant._id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdatePlan(tenant._id)}
                            disabled={updating}
                            className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          >
                            {updating ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            disabled={updating}
                            className="rounded-md border border-border px-3 py-1 text-xs font-medium text-white hover:bg-accent disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditClick(tenant)}
                          className="flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium text-indigo-400 hover:bg-indigo-500/10"
                        >
                          <Edit3 className="h-3 w-3" />
                          Change Plan
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
