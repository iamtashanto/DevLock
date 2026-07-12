'use client';

import { useState, useEffect } from 'react';
import { Users, Edit3, User, Search, Activity } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Tenant {
  _id: string;
  name: string;
  slug: string;
  plan: string;
  owner: { _id: string; name: string; email: string };
  createdAt: string;
  projectCount?: number;
  maxProjects?: number;
}

interface Plan {
  _id: string;
  key: string;
  name: string;
}

export default function SuperAdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tenantsData, plansData] = await Promise.all([
        apiClient.get<Tenant[]>('/admin/tenants'),
        apiClient.get<Plan[]>('/admin/plans')
      ]);
      setTenants(tenantsData || []);
      setPlans(plansData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (tenant: Tenant) => {
    setEditingId(tenant._id);
    setSelectedPlan(tenant.plan || (plans.length > 0 ? plans[0].key : 'free'));
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
      fetchData(); // Refresh to get updated project limit
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.owner?.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 bg-gray-50/50 min-h-full rounded-2xl p-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <Users className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Developers & Subscriptions</h1>
            <p className="mt-1 text-sm text-gray-500">Manage all solo developers and manually override their subscription plans.</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search developers..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-full sm:w-64 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">All Developers ({filteredTenants.length})</h2>
          </div>
        </div>

        {error ? (
          <div className="p-6 text-red-600 bg-red-50">{error}</div>
        ) : loading ? (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-900">No developers found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-medium tracking-wider">Workspace</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Developer</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Current Plan</th>
                  <th className="px-6 py-4 font-medium tracking-wider">Joined Date</th>
                  <th className="px-6 py-4 text-right font-medium tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTenants.map((tenant) => (
                  <tr key={tenant._id} className="transition-colors hover:bg-gray-50/80">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{tenant.name}</div>
                      <div className="text-xs text-indigo-600 font-medium">/{tenant.slug}</div>
                      <div className="text-xs text-gray-500 mt-1">{tenant.projectCount ?? 0} / {tenant.maxProjects ?? 5} Projects</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{tenant.owner?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{tenant.owner?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === tenant._id ? (
                        <select
                          className="rounded-md border border-indigo-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                          value={selectedPlan}
                          onChange={(e) => setSelectedPlan(e.target.value)}
                        >
                          {plans.map((plan) => (
                            <option key={plan.key} value={plan.key}>
                              {plan.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 capitalize text-xs font-bold">
                          <Activity className="w-3 h-3" />
                          {tenant.plan || 'free'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">
                      {new Date(tenant.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                    <td className="flex justify-end gap-2 px-6 py-4">
                      {editingId === tenant._id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdatePlan(tenant._id)}
                            disabled={updating}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                          >
                            {updating ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            disabled={updating}
                            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditClick(tenant)}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all shadow-sm"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
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
