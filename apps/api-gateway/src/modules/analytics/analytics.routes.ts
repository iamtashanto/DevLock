import { Router, type Router as IRouter } from 'express';
import { AnalyticsController } from './analytics.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router: IRouter = Router({ mergeParams: true });
const controller = new AnalyticsController();

router.use(authenticate);

router.get('/overview', authorize('analytics:read'), (req, res, next) => {
  controller.getOverview(req, res).catch(next);
});

router.get('/licenses', authorize('analytics:read'), (req, res, next) => {
  controller.getLicenseStats(req, res).catch(next);
});

router.get('/usage', authorize('analytics:read'), (req, res, next) => {
  controller.getUsage(req, res).catch(next);
});

router.get('/projects/:projectId', authorize('analytics:read'), (req, res, next) => {
  controller.getProjectAnalytics(req, res).catch(next);
});

export { router as analyticsRoutes };
