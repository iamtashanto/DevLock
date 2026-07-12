import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { licenseRoutes } from '../modules/licenses/license.routes.js';
import { sdkRoutes } from '../modules/sdk/sdk.routes.js';
import { projectRoutes } from '../modules/projects/project.routes.js';
import { analyticsRoutes } from '../modules/analytics/analytics.routes.js';
import { adminRoutes } from '../modules/admin/admin.routes.js';
import { billingRoutes } from '../modules/billing/billing.routes.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { ConfigController } from '../modules/projects/config.controller.js';

export function createRoutes(): Router {
  const router = Router();

  // ── Public routes ──────────────────────────────────────────────────
  router.use('/auth', authRoutes);
  
  router.get('/plans', async (req, res, next) => {
    try {
      const { PlanModel } = await import('@/database');
      const plans = await PlanModel.find().sort({ maxProjects: 1 }).lean();
      res.json({ success: true, data: plans });
    } catch (err) {
      next(err);
    }
  });

  // ── SDK routes (API key auth, not JWT) ─────────────────────────────
  router.use('/sdk', sdkRoutes);

  // ── Protected routes (JWT auth) ────────────────────────────────────

  // Projects
  router.use('/projects', projectRoutes);
  // License routes are currently nested under projects manually for the old route:
  router.use('/projects/:projectId/licenses', authenticate, licenseRoutes);

  // Analytics
  router.use('/analytics', analyticsRoutes);

  router.get('/organizations', authenticate, authorize('org:read'), async (req, res, next) => {
    try {
      const { TenantModel } = await import('@/database');
      const tenant = await TenantModel.findById(req.auth!.orgId).lean();
      res.json({ success: true, data: { orgId: req.auth!.orgId, name: tenant?.name, plan: tenant?.plan } });
    } catch (err) {
      next(err);
    }
  });

  // Config & Commands
  const configController = new ConfigController();

  router.get('/projects/:projectId/config', authenticate, authorize('config:read'), (req, res, next) => {
    configController.getConfig(req, res).catch(next);
  });

  router.put('/projects/:projectId/config', authenticate, authorize('config:update'), (req, res, next) => {
    configController.updateConfig(req, res).catch(next);
  });

  router.post('/projects/:projectId/config/kill-switch/activate', authenticate, authorize('config:update'), (req, res, next) => {
    configController.activateKillSwitch(req, res).catch(next);
  });

  router.post('/projects/:projectId/config/kill-switch/deactivate', authenticate, authorize('config:update'), (req, res, next) => {
    configController.deactivateKillSwitch(req, res).catch(next);
  });

  router.post('/projects/:projectId/config/maintenance', authenticate, authorize('config:update'), (req, res, next) => {
    configController.toggleMaintenance(req, res).catch(next);
  });

  // Feature Flags
  router.get('/projects/:projectId/flags', authenticate, authorize('config:read'), (req, res, next) => {
    configController.listFlags(req, res).catch(next);
  });

  router.post('/projects/:projectId/flags', authenticate, authorize('config:update'), (req, res, next) => {
    configController.createFlag(req, res).catch(next);
  });

  router.patch('/projects/:projectId/flags/:flagId', authenticate, authorize('config:update'), (req, res, next) => {
    configController.toggleFlag(req, res).catch(next);
  });

  router.delete('/projects/:projectId/flags/:flagId', authenticate, authorize('config:update'), (req, res, next) => {
    configController.deleteFlag(req, res).catch(next);
  });

  // Audit Logs
  router.get('/organizations/:orgId/audit-logs', authenticate, authorize('audit:read'), (_req, res) => {
    res.json({ success: true, data: [], meta: { total: 0 } });
  });

  // Admin
  router.use('/admin', adminRoutes);

  // Billing
  router.use('/billing', billingRoutes);
  
  router.get('/billing/subscription', authenticate, authorize('org:manage_billing'), (_req, res) => {
    res.json({ success: true, data: { plan: 'free' } });
  });

  // Notifications
  router.get('/notifications', authenticate, (_req, res) => {
    res.json({ success: true, data: [] });
  });

  // Webhooks
  router.get('/projects/:projectId/webhooks', authenticate, authorize('webhook:manage'), (_req, res) => {
    res.json({ success: true, data: [] });
  });

  return router;
}
