'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface Plan {
  _id: string;
  name: string;
  maxProjects: number;
  monthlyPrice: number;
  features: string[];
}

export function PricingSection() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const data = await apiClient.get<Plan[]>('/plans');
        setPlans(data || []);
      } catch (err) {
        console.error('Failed to fetch pricing plans', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mt-16 grid gap-8 lg:grid-cols-3">
      {plans.map((plan) => {
        const isPopular = plan.monthlyPrice > 0;
        return (
          <div
            key={plan._id}
            className={`relative rounded-2xl border p-8 ${
              isPopular
                ? 'border-indigo-500/50 bg-slate-900/80 shadow-lg shadow-indigo-500/10'
                : 'border-slate-800 bg-slate-900/50'
            }`}
          >
            {isPopular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-medium text-white">
                Most Popular
              </div>
            )}
            <h3 className="text-lg font-semibold text-white uppercase">{plan.name}</h3>
            <p className="mt-2 text-sm text-slate-400">Up to {plan.maxProjects} projects.</p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-white">${plan.monthlyPrice}</span>
              <span className="text-slate-500">/month</span>
            </div>
            <ul className="mt-8 space-y-3">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <svg
                    className={`h-4 w-4 shrink-0 ${isPopular ? 'text-indigo-400' : 'text-slate-500'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <a
              href="/register"
              className={`mt-8 block w-full rounded-lg py-3 text-center text-sm font-medium transition ${
                isPopular
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500'
                  : 'border border-slate-700 bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              {isPopular ? 'Start Trial' : 'Get Started'}
            </a>
          </div>
        );
      })}
    </div>
  );
}
