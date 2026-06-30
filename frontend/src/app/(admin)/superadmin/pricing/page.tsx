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
    <div className="space-y-8 bg-gray-50/50 min-h-full rounded-2xl p-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <Shield className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Dynamic Pricing</h1>
            <p className="mt-1 text-sm text-gray-500">Manage subscription plans and features.</p>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Plan
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="text-gray-500 flex items-center gap-2 p-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            Loading plans...
          </div>
        ) : error ? (
          <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>
        ) : plans.length === 0 ? (
          <div className="text-gray-500 bg-white p-8 rounded-2xl border border-gray-200 text-center col-span-full">No plans found. Create one!</div>
        ) : (
          plans.map((plan) => (
            <div
              key={plan._id}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-all ${
                plan.isPopular ? 'border-indigo-300 ring-2 ring-indigo-50/50' : 'border-gray-200'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                  Most Popular
                </div>
              )}
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 capitalize">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(plan)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(plan._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-gray-900">${plan.price}</span>
                <span className="text-sm font-medium text-gray-500">/{plan.currency}</span>
              </div>
              <ul className="mb-6 flex-1 space-y-3">
                {plan.features?.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                    <div className="flex-shrink-0 p-1 bg-indigo-50 rounded-full">
                      <Shield className="h-3 w-3 text-indigo-600" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              {currentPlan?._id ? 'Edit Plan' : 'New Plan'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Key (e.g. starter)</label>
                <input
                  type="text"
                  required
                  value={currentPlan?.key || ''}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, key: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  value={currentPlan?.name || ''}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Price</label>
                  <input
                    type="number"
                    required
                    value={currentPlan?.price || 0}
                    onChange={(e) => setCurrentPlan({ ...currentPlan, price: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Currency</label>
                  <input
                    type="text"
                    value={currentPlan?.currency || 'USD'}
                    onChange={(e) => setCurrentPlan({ ...currentPlan, currency: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Features (comma separated)</label>
                <input
                  type="text"
                  value={currentPlan?.features?.join(', ') || ''}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, features: e.target.value.split(',').map(s=>s.trim()) })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPopular"
                  checked={currentPlan?.isPopular || false}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, isPopular: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isPopular" className="text-sm font-medium text-gray-700 cursor-pointer">Mark as Most Popular</label>
              </div>
              
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
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
