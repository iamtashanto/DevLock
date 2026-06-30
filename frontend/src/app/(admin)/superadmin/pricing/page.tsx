'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Plan {
  _id: string;
  key: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<Plan> | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<Plan[]>('/admin/plans');
      setPlans(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentPlan?._id) {
        await apiClient.put(`/admin/plans/${currentPlan._id}`, currentPlan);
      } else {
        await apiClient.post('/admin/plans', currentPlan);
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      alert(err.message || 'Failed to save plan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await apiClient.delete(`/admin/plans/${id}`);
      fetchPlans();
    } catch (err: any) {
      alert(err.message || 'Failed to delete plan');
    }
  };

  const openModal = (plan?: Plan) => {
    if (plan) {
      setCurrentPlan(plan);
    } else {
      setCurrentPlan({ features: [], isPopular: false, isActive: true, currency: 'USD' });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-indigo-500" />
          <div>
            <h1 className="text-2xl font-semibold text-white">Dynamic Pricing</h1>
            <p className="mt-1 text-gray-400">Manage subscription plans and features.</p>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Plan
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : plans.length === 0 ? (
          <div className="text-gray-400">No plans found. Create one!</div>
        ) : (
          plans.map((plan) => (
            <div
              key={plan._id}
              className={`relative flex flex-col rounded-2xl border bg-gray-900/50 p-6 shadow-xl backdrop-blur-sm transition-all ${
                plan.isPopular ? 'border-indigo-500 shadow-indigo-500/10' : 'border-gray-800'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-3 py-1 text-xs font-medium text-white">
                  Most Popular
                </div>
              )}
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white capitalize">{plan.name}</h3>
                  <p className="text-sm text-gray-400">{plan.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(plan)} className="text-gray-400 hover:text-indigo-400">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(plan._id)} className="text-gray-400 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">${plan.price}</span>
                <span className="text-sm text-gray-400">/{plan.currency}</span>
              </div>
              <ul className="mb-6 flex-1 space-y-3">
                {plan.features?.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <Shield className="h-4 w-4 text-indigo-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-semibold text-white">
              {currentPlan?._id ? 'Edit Plan' : 'New Plan'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-400">Key (e.g. starter)</label>
                <input
                  type="text"
                  required
                  value={currentPlan?.key || ''}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, key: e.target.value })}
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">Name</label>
                <input
                  type="text"
                  required
                  value={currentPlan?.name || ''}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm text-gray-400">Price</label>
                  <input
                    type="number"
                    required
                    value={currentPlan?.price || 0}
                    onChange={(e) => setCurrentPlan({ ...currentPlan, price: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm text-gray-400">Currency</label>
                  <input
                    type="text"
                    value={currentPlan?.currency || 'USD'}
                    onChange={(e) => setCurrentPlan({ ...currentPlan, currency: e.target.value })}
                    className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">Features (comma separated)</label>
                <input
                  type="text"
                  value={currentPlan?.features?.join(', ') || ''}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, features: e.target.value.split(',').map(s=>s.trim()) })}
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPopular"
                  checked={currentPlan?.isPopular || false}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, isPopular: e.target.checked })}
                  className="rounded border-gray-800 bg-gray-950 text-indigo-500 focus:ring-indigo-500"
                />
                <label htmlFor="isPopular" className="text-sm text-gray-400">Mark as Most Popular</label>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
