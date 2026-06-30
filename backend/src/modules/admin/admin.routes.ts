import { Router, type Router as IRouter } from 'express';
import { AdminController } from './admin.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireSuperAdmin } from '../../middleware/require-superadmin.js';

const router: IRouter = Router({ mergeParams: true });
const controller = new AdminController();

router.use(authenticate);
router.use(requireSuperAdmin);

router.get('/stats', (req, res, next) => {
  controller.getDashboardStats(req, res).catch(next);
});

router.get('/payments', (req, res, next) => {
  controller.listManualPayments(req, res).catch(next);
});

router.post('/payments/:paymentId/approve', (req, res, next) => {
  controller.approvePayment(req, res).catch(next);
});

router.post('/payments/:paymentId/reject', (req, res, next) => {
  controller.rejectPayment(req, res).catch(next);
});

router.get('/tenants', (req, res, next) => {
  controller.listTenants(req, res).catch(next);
});

router.post('/tenants/:tenantId/plan', (req, res, next) => {
  controller.updateTenantPlan(req, res).catch(next);
});

router.get('/status', (req, res, next) => {
  controller.getSystemStatus(req, res).catch(next);
});

router.get('/plans', (req, res, next) => {
  controller.getPlans(req, res).catch(next);
});

router.post('/plans', (req, res, next) => {
  controller.createPlan(req, res).catch(next);
});

router.put('/plans/:id', (req, res, next) => {
  controller.updatePlan(req, res).catch(next);
});

router.delete('/plans/:id', (req, res, next) => {
  controller.deletePlan(req, res).catch(next);
});

export { router as adminRoutes };
