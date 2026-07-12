import { PlanModel } from './models/plan.model.js';
import { UserModel } from './models/user.model.js';
import { TenantModel } from './models/tenant.model.js';
import { hashPassword } from '../encryption/index.js';
import { createLogger } from '../logger/index.js';

const logger = createLogger({ service: 'database-seed' });

export async function autoSeed() {
  try {
    // 1. Seed Pricing Plans
    const planCount = await PlanModel.countDocuments();
    if (planCount === 0) {
      logger.info('No pricing plans found. Seeding default plans...');
      const plans = [
        {
          key: 'free',
          name: 'Free (14 Days Trial)',
          description: 'Try DevLock with full features for 14 days',
          price: 0,
          currency: 'USD',
          features: ['Up to 3 Projects', 'Basic Analytics', 'Community Support'],
          maxProjects: 3,
          isPopular: false,
          isActive: true,
        },
        {
          key: 'starter',
          name: 'Starter',
          description: 'For growing indie hackers',
          price: 3,
          currency: 'USD',
          features: ['Unlimited Projects', 'Advanced Analytics', 'Priority Support', 'Custom Branding'],
          maxProjects: 20,
          isPopular: true,
          isActive: true,
        },
        {
          key: 'business',
          name: 'Business',
          description: 'For serious businesses and teams',
          price: 10,
          currency: 'USD',
          features: ['Everything in Starter', 'Dedicated Account Manager', 'White-labeling', '99.9% Uptime SLA'],
          maxProjects: 9999,
          isPopular: false,
          isActive: true,
        }
      ];

      for (const plan of plans) {
        await PlanModel.create(plan);
      }
      logger.info('Default pricing plans seeded successfully.');
    }

    // 2. Seed Super Admin
    const superAdminEmail = 'admin@devlock.tashanto.com';
    const superAdminPassword = 'AdShanto#26';
    
    let user = await UserModel.findOne({ email: superAdminEmail });
    if (!user) {
      logger.info('Super admin not found. Creating default super admin...');
      
      const passwordHash = await hashPassword(superAdminPassword);
      
      const org = await TenantModel.create({
        name: 'Super Admin Org',
        slug: 'super-admin-org-' + Date.now(),
        plan: 'business',
        settings: {},
        billing: {},
      });

      user = await UserModel.create({
        tenantId: org._id,
        email: superAdminEmail,
        name: 'Super Admin',
        passwordHash,
        role: 'owner',
        mfa: { enabled: false },
        isSuperAdmin: true,
      });

      org.owner = user._id;
      await org.save();

      logger.info('Default super admin created successfully.');
    }

  } catch (err) {
    logger.error({ err }, 'Error during database auto-seeding');
  }
}
