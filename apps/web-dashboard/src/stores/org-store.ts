import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  logoUrl?: string;
  createdAt: string;
}

interface OrgState {
  currentOrg: Organization | null;
  organizations: Organization[];
  setCurrentOrg: (org: Organization) => void;
  setOrganizations: (orgs: Organization[]) => void;
  addOrganization: (org: Organization) => void;
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set) => ({
      currentOrg: null,
      organizations: [],

      setCurrentOrg: (org: Organization) => {
        set({ currentOrg: org });
      },

      setOrganizations: (orgs: Organization[]) => {
        set({ organizations: orgs });
      },

      addOrganization: (org: Organization) => {
        set((state) => ({
          organizations: [...state.organizations, org],
        }));
      },
    }),
    {
      name: 'devlock-org',
    }
  )
);
