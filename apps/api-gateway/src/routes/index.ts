import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { licenseRoutes } from '../modules/licenses/license.routes.js';
import { sdkRoutes } from '../modules/sdk/sdk.routes.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

export function createRoutes(): Router {
  const router = Router();

  // ── Public routes ──────────────────────────────────────────────────
  router.use('/auth', authRoutes);

  // ── SDK routes (API key auth, not JWT) ─────────────────────────────
  router.use('/sdk', sdkRoutes);

  // ── Protected routes (JWT auth) ────────────────────────────────────

  // Projects
  router.use('/projects/:projectId/licenses', authenticate, licenseRoutes);

  // Analytics (global overview for dashboard home)
  router.get('/analytics/overview', authenticate, (req, res) => {
    res.json({
      success: true,
      data: {
        totalProjects: 0,
        totalLicenses: 0,
        activeLicenses: 0,
        expiredLicenses: 0,
        suspendedLicenses: 0,
        activeDevices: 0,
        validationsToday: 0,
        totalValidations: 0,
      },
    });
  });

  // Placeholder routes for other modules
  router.get('/projects', authenticate, authorize('project:read'), (_req, res) => {
    res.json({ success: true, data: [], meta: { total: 0 } });
  });

  router.get('/organizations', authenticate, authorize('org:read'), (req, res) => {
    res.json({ success: true, data: { orgId: req.auth!.orgId } });
  });

  // Config & Commands
  router.get('/projects/:projectId/config', authenticate, authorize('config:read'), (_req, res) => {
    res.json({ success: true, data: {} });
  });

  router.put('/projects/:projectId/config', authenticate, authorize('config:update'), (_req, res) => {
    res.json({ success: true, data: { updated: true } });
  });

  // Feature Flags
  router.get('/projects/:projectId/flags', authenticate, authorize('config:read'), (_req, res) => {
    res.json({ success: true, data: [] });
  });

  // Analytics
  router.get('/projects/:projectId/analytics/overview', authenticate, authorize('analytics:read'), (_req, res) => {
    res.json({ success: true, data: {} });
  });

  // Audit Logs
  router.get('/organizations/:orgId/audit-logs', authenticate, authorize('audit:read'), (_req, res) => {
    res.json({ success: true, data: [], meta: { total: 0 } });
  });

  // Billing
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
